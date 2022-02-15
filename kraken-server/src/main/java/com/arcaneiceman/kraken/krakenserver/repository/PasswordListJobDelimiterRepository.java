package com.arcaneiceman.kraken.krakenserver.repository;

import com.arcaneiceman.kraken.krakenserver.domain.PasswordList;
import com.arcaneiceman.kraken.krakenserver.domain.PasswordListJobDelimiter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordListJobDelimiterRepository extends JpaRepository<PasswordListJobDelimiter, String> {

    Optional<PasswordListJobDelimiter> findByIndexNumberAndOwner(Long indexNumber, PasswordList owner);

    List<PasswordListJobDelimiter> findByOwner(PasswordList owner);

}
