package com.arcaneiceman.kraken.krakenserver.domain;

import com.arcaneiceman.kraken.krakenserver.domain.abs.TrackedList;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.ListType;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import java.util.ArrayList;

@Getter
@Setter
@Entity
@NoArgsConstructor
@DiscriminatorValue(ListType.Constants.CRUNCH_VALUE)
public class TrackedCrunchList extends TrackedList {

    @Column
    @ApiModelProperty(hidden = true)
    private Integer min;

    @Column
    @ApiModelProperty(hidden = true)
    private Integer max;

    @Column
    @ApiModelProperty(hidden = true)
    private String characters;

    @Column
    @ApiModelProperty(hidden = true)
    private String nextJobString;

    @Column
    @ApiModelProperty(hidden = true)
    private String pattern;

    public TrackedCrunchList(String listName,
                             Long totalJobs,
                             Integer min,
                             Integer max,
                             String characters,
                             String nextJobString,
                             String pattern,
                             ActiveRequest owner) {
        super(null, listName, ListType.CRUNCH, TrackingStatus.PENDING, totalJobs,
                0L, 0L, 0L, new ArrayList<>(), owner);
        this.min = min;
        this.max = max;
        this.characters = characters;
        this.nextJobString = nextJobString;
        this.pattern = pattern;
    }

}
