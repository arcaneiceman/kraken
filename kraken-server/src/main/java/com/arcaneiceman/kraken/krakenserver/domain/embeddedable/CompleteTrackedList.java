package com.arcaneiceman.kraken.krakenserver.domain.embeddedable;

import com.arcaneiceman.kraken.krakenserver.domain.abs.TrackedList;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.ListType;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;

@Data
@NoArgsConstructor
@Embeddable
public class CompleteTrackedList {

    @Column
    private String listName;
    @Column
    @Enumerated(EnumType.STRING)
    private ListType listType;
    @Column
    @Enumerated(EnumType.STRING)
    private TrackingStatus trackingStatus;
    @Column
    private Long totalJobCount;
    @Column
    private Long completedJobCount;
    @Column
    private Long errorJobCount;

    public CompleteTrackedList(TrackedList trackedList) {
        this.listName = trackedList.getListName();
        this.listType = trackedList.getListType();
        this.trackingStatus = trackedList.getTrackingStatus();
        this.totalJobCount = trackedList.getTotalJobCount();
        this.completedJobCount = trackedList.getCompletedJobCount();
        this.errorJobCount = trackedList.getErrorJobCount();
    }

}
