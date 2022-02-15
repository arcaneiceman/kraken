package com.arcaneiceman.kraken.krakenserver.repository;

import com.arcaneiceman.kraken.krakenserver.domain.PasswordList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Created by Wali on 4/22/2018.
 */
@Repository
public interface PasswordListRepository extends JpaRepository<PasswordList, String> {

}
