package com.inventory.identity.service;

import com.inventory.identity.dto.*;
import com.inventory.identity.model.*;
import com.inventory.identity.repository.*;
import com.inventory.identity.security.JwtTokenProvider;
import com.inventory.identity.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PermissionRepository permissionRepository;
    
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtTokenProvider tokenProvider;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Transactional
    public JwtResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        // Update last login
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        // Fetch organization to get tenantId
        String tenantId = "UNKNOWN";
        try {
            if (user.getOrgId() != null) {
                ResponseEntity<Map> orgResponse = restTemplate.getForEntity(
                    "http://user-service/api/organizations/" + user.getOrgId(),
                    Map.class
                );
                if (orgResponse.getBody() != null && orgResponse.getBody().get("tenantId") != null) {
                    tenantId = (String) orgResponse.getBody().get("tenantId");
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: Failed to fetch tenantId for orgId " + user.getOrgId() + ": " + e.getMessage());
        }
        
        String jwt = tokenProvider.generateToken(authentication, userDetails.getId(), 
                                                 userDetails.getOrgId(), tenantId, userDetails.getBranchId());
        String refreshToken = tokenProvider.generateRefreshToken(userDetails.getUsername());
        
        // Save refresh token
        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setToken(refreshToken);
        refreshTokenEntity.setUser(user);
        refreshTokenEntity.setExpiryDate(LocalDateTime.now().plusDays(7));
        refreshTokenRepository.save(refreshTokenEntity);
        
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());
        
        // Get industry type from user
        String industryType = user.getIndustryType();
        
        return new JwtResponse(jwt, refreshToken, userDetails.getId(), 
                              userDetails.getUsername(), userDetails.getEmail(),
                              userDetails.getOrgId(), tenantId, userDetails.getBranchId(), industryType, roles);
    }
    
    @Transactional
    public MessageResponse register(SignupRequest signupRequest) {
        // Validate email
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }
        
        // Step 1: Create Organization via user-service
        Map<String, Object> organizationRequest = new HashMap<>();
        organizationRequest.put("name", signupRequest.getCompanyName());
        organizationRequest.put("industryType", signupRequest.getIndustryType().toUpperCase());
        organizationRequest.put("tenantId", "TENANT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        organizationRequest.put("contactEmail", signupRequest.getContactEmail() != null ? signupRequest.getContactEmail() : signupRequest.getEmail());
        organizationRequest.put("contactPhone", signupRequest.getContactPhone() != null ? signupRequest.getContactPhone() : signupRequest.getPhoneNumber());
        organizationRequest.put("taxId", signupRequest.getTaxId());
        organizationRequest.put("subscriptionTier", "STARTER");
        organizationRequest.put("isActive", true);
        
        Long orgId = null;
        try {
            ResponseEntity<Map> orgResponse = restTemplate.postForEntity(
                "http://user-service/api/organizations",
                organizationRequest,
                Map.class
            );
            
            if (orgResponse.getBody() != null && orgResponse.getBody().get("id") != null) {
                orgId = Long.valueOf(orgResponse.getBody().get("id").toString());
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            // Log the detailed error response
            System.err.println("Failed to create organization. Status: " + e.getStatusCode());
            System.err.println("Response body: " + e.getResponseBodyAsString());
            throw new RuntimeException("Error: Failed to create organization. " + e.getResponseBodyAsString());
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error: Failed to create organization. " + e.getMessage());
        }
        
        if (orgId == null) {
            throw new RuntimeException("Error: Failed to get organization ID!");
        }
        
        // Step 2: Create User (owner) and link to organization
        User user = new User();
        user.setUsername(signupRequest.getEmail()); // Use email as username
        user.setEmail(signupRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        user.setFirstName(signupRequest.getFirstName());
        user.setLastName(signupRequest.getLastName());
        user.setPhoneNumber(signupRequest.getPhoneNumber());
        user.setIndustryType(signupRequest.getIndustryType().toUpperCase()); // Store industry type on user
        user.setOrgId(orgId); // Link user to organization
        user.setIsActive(true);
        
        // Assign OWNER role
        Role ownerRole = roleRepository.findByName(RoleName.ROLE_ORG_ADMIN)
                .orElseThrow(() -> new RuntimeException("Error: OWNER role is not found."));
        
        Set<Role> roles = new HashSet<>();
        roles.add(ownerRole);
        user.setRoles(roles);
        
        userRepository.save(user);
        
        return new MessageResponse("User and organization registered successfully!");
    }
    
    @Transactional
    public JwtResponse refreshToken(RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        
        if (!tokenProvider.validateToken(requestRefreshToken)) {
            throw new RuntimeException("Refresh token is invalid or expired!");
        }
        
        RefreshToken refreshToken = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh token not found!"));
        
        if (refreshToken.getIsRevoked() || refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Refresh token is expired or revoked!");
        }
        
        User user = refreshToken.getUser();
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
        
        // Fetch organization to get tenantId
        String tenantId = "UNKNOWN";
        try {
            if (user.getOrgId() != null) {
                ResponseEntity<Map> orgResponse = restTemplate.getForEntity(
                    "http://user-service/api/organizations/" + user.getOrgId(),
                    Map.class
                );
                if (orgResponse.getBody() != null && orgResponse.getBody().get("tenantId") != null) {
                    tenantId = (String) orgResponse.getBody().get("tenantId");
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: Failed to fetch tenantId for orgId " + user.getOrgId() + ": " + e.getMessage());
        }
        
        String newJwt = tokenProvider.generateToken(authentication, user.getId(), 
                                                    user.getOrgId(), tenantId, user.getBranchId());
        
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());
        
        // Get industry type from user
        String industryType = user.getIndustryType();
        
        return new JwtResponse(newJwt, requestRefreshToken, user.getId(), 
                              user.getUsername(), user.getEmail(),
                              user.getOrgId(), tenantId, user.getBranchId(), industryType, roles);
    }
    
    @Transactional
    public void logout(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));
        
        refreshTokenRepository.deleteByUser(user);
    }
}
