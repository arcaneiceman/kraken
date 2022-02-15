package com.arcaneiceman.kraken.krakenserver.repository;

import com.arcaneiceman.kraken.krakenserver.domain.ActiveRequest;
import com.arcaneiceman.kraken.krakenserver.domain.abs.TrackedList;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface TrackedListRepository extends JpaRepository<TrackedList, String> {

    //@QueryHints({@QueryHint(name = "javax.persistence.lock.timeout", value ="5000")})
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    TrackedList findFirstByTrackingStatusAndOwner(TrackingStatus trackingStatus, ActiveRequest owner);

    //@QueryHints({@QueryHint(name = "javax.persistence.lock.timeout", value ="5000")})
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<TrackedList> findByIdAndOwner(String id, ActiveRequest owner);

}
