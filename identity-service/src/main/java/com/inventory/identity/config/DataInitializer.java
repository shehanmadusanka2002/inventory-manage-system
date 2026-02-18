package com.inventory.identity.config;

import com.inventory.identity.model.Permission;
import com.inventory.identity.model.Role;
import com.inventory.identity.model.RoleName;
import com.inventory.identity.repository.PermissionRepository;
import com.inventory.identity.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PermissionRepository permissionRepository;
    
    @Override
    public void run(String... args) throws Exception {
        // Create permissions if they don't exist
        createPermissionsIfNotExist();
        
        // Create roles if they don't exist
        createRolesIfNotExist();
    }
    
    private void createPermissionsIfNotExist() {
        String[] resources = {"product", "inventory", "order", "warehouse", "supplier", "user", "report"};
        String[] actions = {"create", "read", "update", "delete"};
        
        for (String resource : resources) {
            for (String action : actions) {
                String permissionName = resource + ":" + action;
                if (!permissionRepository.existsByName(permissionName)) {
                    Permission permission = new Permission();
                    permission.setName(permissionName);
                    permission.setResource(resource);
                    permission.setAction(action);
                    permission.setDescription("Permission to " + action + " " + resource);
                    permissionRepository.save(permission);
                }
            }
        }
    }
    
    private void createRolesIfNotExist() {
        // Super Admin - Full access
        if (!roleRepository.existsByName(RoleName.ROLE_SUPER_ADMIN)) {
            Role superAdmin = new Role();
            superAdmin.setName(RoleName.ROLE_SUPER_ADMIN);
            superAdmin.setDescription("System administrator with full access");
            superAdmin.setPermissions(new HashSet<>(permissionRepository.findAll()));
            roleRepository.save(superAdmin);
        }
        
        // Org Admin - Organization level admin
        if (!roleRepository.existsByName(RoleName.ROLE_ORG_ADMIN)) {
            Role orgAdmin = new Role();
            orgAdmin.setName(RoleName.ROLE_ORG_ADMIN);
            orgAdmin.setDescription("Organization administrator");
            orgAdmin.setPermissions(getAllPermissionsExcept("user:delete"));
            roleRepository.save(orgAdmin);
        }
        
        // Manager - Branch/Department manager
        if (!roleRepository.existsByName(RoleName.ROLE_MANAGER)) {
            Role manager = new Role();
            manager.setName(RoleName.ROLE_MANAGER);
            manager.setDescription("Branch or department manager");
            manager.setPermissions(getPermissions(new String[]{
                "product:read", "product:update",
                "inventory:read", "inventory:update",
                "order:read", "order:create", "order:update",
                "warehouse:read",
                "supplier:read",
                "report:read"
            }));
            roleRepository.save(manager);
        }
        
        // Warehouse Staff
        if (!roleRepository.existsByName(RoleName.ROLE_WAREHOUSE_STAFF)) {
            Role warehouseStaff = new Role();
            warehouseStaff.setName(RoleName.ROLE_WAREHOUSE_STAFF);
            warehouseStaff.setDescription("Warehouse operations staff");
            warehouseStaff.setPermissions(getPermissions(new String[]{
                "product:read",
                "inventory:read", "inventory:create", "inventory:update",
                "warehouse:read",
                "order:read", "order:update"
            }));
            roleRepository.save(warehouseStaff);
        }
        
        // Sales Staff
        if (!roleRepository.existsByName(RoleName.ROLE_SALES_STAFF)) {
            Role salesStaff = new Role();
            salesStaff.setName(RoleName.ROLE_SALES_STAFF);
            salesStaff.setDescription("Sales and order management staff");
            salesStaff.setPermissions(getPermissions(new String[]{
                "product:read",
                "inventory:read",
                "order:read", "order:create", "order:update"
            }));
            roleRepository.save(salesStaff);
        }
        
        // Procurement
        if (!roleRepository.existsByName(RoleName.ROLE_PROCUREMENT)) {
            Role procurement = new Role();
            procurement.setName(RoleName.ROLE_PROCUREMENT);
            procurement.setDescription("Procurement and supplier management");
            procurement.setPermissions(getPermissions(new String[]{
                "product:read", "product:create",
                "supplier:read", "supplier:create", "supplier:update",
                "inventory:read",
                "order:read"
            }));
            roleRepository.save(procurement);
        }
        
        // Accountant
        if (!roleRepository.existsByName(RoleName.ROLE_ACCOUNTANT)) {
            Role accountant = new Role();
            accountant.setName(RoleName.ROLE_ACCOUNTANT);
            accountant.setDescription("Financial and reporting access");
            accountant.setPermissions(getPermissions(new String[]{
                "product:read",
                "inventory:read",
                "order:read",
                "supplier:read",
                "report:read"
            }));
            roleRepository.save(accountant);
        }
        
        // Auditor
        if (!roleRepository.existsByName(RoleName.ROLE_AUDITOR)) {
            Role auditor = new Role();
            auditor.setName(RoleName.ROLE_AUDITOR);
            auditor.setDescription("Read-only audit access");
            auditor.setPermissions(getReadOnlyPermissions());
            roleRepository.save(auditor);
        }
        
        // Basic User
        if (!roleRepository.existsByName(RoleName.ROLE_USER)) {
            Role user = new Role();
            user.setName(RoleName.ROLE_USER);
            user.setDescription("Basic user with limited access");
            user.setPermissions(getPermissions(new String[]{
                "product:read",
                "inventory:read",
                "order:read"
            }));
            roleRepository.save(user);
        }
    }
    
    private Set<Permission> getAllPermissionsExcept(String... excludeNames) {
        Set<Permission> permissions = new HashSet<>(permissionRepository.findAll());
        for (String excludeName : excludeNames) {
            permissionRepository.findByName(excludeName)
                    .ifPresent(permissions::remove);
        }
        return permissions;
    }
    
    private Set<Permission> getPermissions(String[] permissionNames) {
        Set<Permission> permissions = new HashSet<>();
        for (String name : permissionNames) {
            permissionRepository.findByName(name)
                    .ifPresent(permissions::add);
        }
        return permissions;
    }
    
    private Set<Permission> getReadOnlyPermissions() {
        return new HashSet<>(permissionRepository.findByAction("read"));
    }
}
