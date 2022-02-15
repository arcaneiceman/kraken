package com.arcaneiceman.kraken.krakenserver.domain;

import com.arcaneiceman.kraken.krakenserver.domain.abs.TrackedList;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.Date;
import java.util.List;

/**
 * Created by Wali on 4/21/2018.
 */
@EqualsAndHashCode(callSuper = false, of = {"startIndex", "startMarker"})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
@Table(name = "jobs")
@Entity
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
public class Job {

    private static final long serialVersionUID = 1L;

    /**
     * Using synthetic key to avoid repeating data
     */
    @JsonIgnore
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    private String id;

    // Used by Password Lists and Crunch Lists
    @Column
    private Long startIndex;

    // Used by Crunch List
    @Column
    private String startMarker;

    @Column
    private Long multiplier;

    @Column
    @Enumerated(EnumType.STRING)
    private TrackingStatus trackingStatus;

    @Column
    private Integer errorCount;

    @Column
    private Date willExpireAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    private Worker worker;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    private TrackedList owner;

    @Transient
    private List<String> values;

}
