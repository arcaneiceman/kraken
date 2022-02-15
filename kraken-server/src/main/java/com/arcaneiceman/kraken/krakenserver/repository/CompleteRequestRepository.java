package com.arcaneiceman.kraken.krakenserver.repository;

import com.arcaneiceman.kraken.krakenserver.domain.CompleteRequest;
import com.arcaneiceman.kraken.krakenserver.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompleteRequestRepository extends JpaRepository<CompleteRequest, String> {

    Page<CompleteRequest> findByOwner(Pageable pageable, User owner);

    List<CompleteRequest> findByOwner(User owner);

    List<CompleteRequest> findByOwnerAndResultsNot(User owner, String result);

    Optional<CompleteRequest> findByIdAndOwner(String id, User owner);
}
