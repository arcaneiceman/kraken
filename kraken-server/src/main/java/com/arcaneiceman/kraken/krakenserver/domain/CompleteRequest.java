package com.arcaneiceman.kraken.krakenserver.domain;

import com.arcaneiceman.kraken.krakenserver.domain.embeddedable.CompleteTrackedList;
import com.arcaneiceman.kraken.krakenserver.domain.enumerations.TrackingStatus;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = false, of = "id")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "completed_requests")
@Entity
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
public class CompleteRequest {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    private String id;

    @NotNull
    @Column
    private String requestType;

    @NotNull
    @Column
    private String requestName;

    @Column(columnDefinition = "TEXT")
    private String requestMetadata;

    @JsonGetter
    public Map<String, String> getRequestMetadata() throws IOException {
        return new ObjectMapper().readValue(requestMetadata, new TypeReference<HashMap<String, String>>() {
        });
    }

    @NotNull
    @Column(nullable = false)
    private Integer targetCount;

    @ElementCollection(fetch = FetchType.EAGER)
    private List<CompleteTrackedList> trackedLists;

    @Column(columnDefinition = "TEXT")
    private String results;

    @JsonGetter
    public Map<String, String> getResults() throws IOException {
        return new ObjectMapper().readValue(results, new TypeReference<HashMap<String, String>>() {
        });
    }

    @NotNull
    @Column
    private TrackingStatus status;

    @JsonIgnore
    @ManyToOne
    private User owner;
}
