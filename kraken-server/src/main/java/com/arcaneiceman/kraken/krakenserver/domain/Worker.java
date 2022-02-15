package com.arcaneiceman.kraken.krakenserver.domain;

import com.arcaneiceman.kraken.krakenserver.domain.enumerations.WorkerStatus;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.WorkerType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.Date;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Table(name = "workers")
@Entity
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
public class Worker {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    private String id;

    @Column
    private String name;

    @Column
    @Enumerated(EnumType.STRING)
    private WorkerType type;

    @Column(columnDefinition = "TEXT")
    private String platform;

    @Column
    private Long totalJobCount;

    @Column
    private Long completedJobCount;

    @Column
    private Long errorJobCount;

    @Column
    @Enumerated(EnumType.STRING)
    private WorkerStatus status;

    @Column
    private Date lastCheckIn;

    @OneToMany(mappedBy = "worker", fetch = FetchType.LAZY)
    private List<Job> jobList;

    @JsonIgnore
    @ManyToOne
    private User owner;

}
