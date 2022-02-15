package com.arcaneiceman.kraken.krakenserver.repository;

import com.arcaneiceman.kraken.krakenserver.domain.User;
import com.arcaneiceman.kraken.krakenserver.domain.Worker;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.WorkerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Stream<Worker> getByStatusAndLastCheckInBefore(WorkerStatus status, Date currentTimeMinusExpiry);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Worker> findByIdAndOwner(String id, User owner);

    Page<Worker> findByOwner(User owner, Pageable pageable);

    List<Worker> findByOwner(User owner);

}
