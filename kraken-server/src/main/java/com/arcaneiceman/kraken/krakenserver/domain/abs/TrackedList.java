package com.arcaneiceman.kraken.krakenserver.domain.abs;

import com.arcaneiceman.kraken.krakenserver.domain.ActiveRequest;
import com.arcaneiceman.kraken.krakenserver.domain.Job;
import com.arcaneiceman.kraken.krakenserver.domain.TrackedCrunchList;
import com.arcaneiceman.kraken.krakenserver.domain.TrackedPasswordList;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.ListType;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.List;

@Getter
@Setter
@EqualsAndHashCode(callSuper = false, of = "id")
@Entity
@Table(name = "tracked_lists")
@AllArgsConstructor
@NoArgsConstructor
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "listType")
@JsonSubTypes({
        @JsonSubTypes.Type(value = TrackedPasswordList.class, name = ListType.Constants.PASSWORD_LIST_VALUE),
        @JsonSubTypes.Type(value = TrackedCrunchList.class, name = ListType.Constants.CRUNCH_VALUE)})
@DiscriminatorColumn(name = "list_type", discriminatorType = DiscriminatorType.STRING)
public abstract class TrackedList {

    private static final long serialVersionUID = 1L;

    @JsonIgnore
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    private String id;

    @Column
    private String listName;

    @Column(name = "list_type", insertable = false, updatable = false)
    @Enumerated(EnumType.STRING)
    private ListType listType;

    @Column
    @Enumerated(EnumType.STRING)
    private TrackingStatus trackingStatus;

    @Column
    private Long totalJobCount;

    @Column
    private Long nextJobIndex;

    @Column
    private Long completedJobCount;

    @Column
    private Long errorJobCount;

    @JsonIgnore
    @OneToMany(mappedBy = "owner", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Job> jobQueue;

    @JsonIgnore
    @ManyToOne
    private ActiveRequest owner;

}
