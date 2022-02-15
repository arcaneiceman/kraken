package com.arcaneiceman.kraken.krakenserver.repository;

import com.arcaneiceman.kraken.krakenserver.domain.Job;
import com.arcaneiceman.kraken.krakenserver.domain.abs.TrackedList;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.util.Date;
import java.util.Optional;
import java.util.stream.Stream;

@Repository
public interface JobRepository extends JpaRepository<Job, String> {

    //@QueryHints({@QueryHint(name = "javax.persistence.lock.timeout", value ="5000")})
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Stream<Job> findByTrackingStatusAndWillExpireAtBefore(TrackingStatus trackingStatus, Date currentTime);

    //@QueryHints({@QueryHint(name = "javax.persistence.lock.timeout", value ="5000")})
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Job> findByIdAndOwner(String id, TrackedList owner);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Job findFirstByOwnerAndTrackingStatus(TrackedList owner, TrackingStatus trackingStatus);
}
