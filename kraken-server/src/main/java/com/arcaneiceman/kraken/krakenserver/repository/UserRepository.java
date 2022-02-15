package com.arcaneiceman.kraken.krakenserver.repository;

import com.arcaneiceman.kraken.krakenserver.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    @Query("SELECT u FROM User u WHERE u.email = ?1")
    Optional<User> findByUsername(String username);

    Optional<User> findUserByEmail(String email);

}
