package com.arcaneiceman.kraken.krakenserver.domain;

import com.arcaneiceman.kraken.krakenserver.domain.abs.TrackedList;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.ListType;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import java.util.ArrayList;

@Getter
@Setter
@Entity
@NoArgsConstructor
@DiscriminatorValue(ListType.Constants.PASSWORD_LIST_VALUE)
public class TrackedPasswordList extends TrackedList {

    public TrackedPasswordList(Long totalJobs, String passwordListName, ActiveRequest owner) {
        super(null, passwordListName, ListType.PASSWORD_LIST, TrackingStatus.PENDING, totalJobs,
                0L, 0L, 0L, new ArrayList<>(), owner);
    }

}
