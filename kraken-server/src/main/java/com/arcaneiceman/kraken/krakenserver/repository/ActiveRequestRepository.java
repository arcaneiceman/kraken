package com.arcaneiceman.kraken.krakenserver.repository;

import com.arcaneiceman.kraken.krakenserver.domain.ActiveRequest;
import com.arcaneiceman.kraken.krakenserver.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActiveRequestRepository extends JpaRepository<ActiveRequest, String> {

    Page<ActiveRequest> findByOwner(Pageable pageable, User owner);

    List<ActiveRequest> findByOwner(User owner);

    //@QueryHints({@QueryHint(name = "javax.persistence.lock.timeout", value ="5000")})
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    ActiveRequest findFirstByOwner(User owner);

    //@QueryHints({@QueryHint(name = "javax.persistence.lock.timeout", value ="5000")})
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<ActiveRequest> findByIdAndOwner(String id, User owner);

}
