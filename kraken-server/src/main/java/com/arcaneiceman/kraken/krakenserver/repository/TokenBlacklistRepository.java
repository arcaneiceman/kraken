package com.arcaneiceman.kraken.krakenserver.repository;

import com.arcaneiceman.kraken.krakenserver.domain.BlacklistToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Created by wali on 30/10/17.
 */
@Repository
public interface TokenBlacklistRepository extends JpaRepository<BlacklistToken, String> {

    BlacklistToken findByTokenDigest(String token);

    List<BlacklistToken> findByCleanUpTimeBefore(Long time);
}
