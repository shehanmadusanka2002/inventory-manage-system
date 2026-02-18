package com.inventory.identity.repository;

import com.inventory.identity.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    List<User> findByOrgId(Long orgId);
    List<User> findByBranchId(Long branchId);
    List<User> findByIsActive(Boolean isActive);
}
