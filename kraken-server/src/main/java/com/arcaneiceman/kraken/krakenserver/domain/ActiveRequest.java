package com.arcaneiceman.kraken.krakenserver.domain;

import com.arcaneiceman.kraken.krakenserver.domain.abs.TrackedList;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
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
@Table(name = "active_requests")
@Entity
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
public class ActiveRequest {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    private String id;

    @NotNull
    @Column
    private String requestName;

    @NotNull
    @Column
    private String requestType;

    @Column(columnDefinition = "TEXT")
    private String requestMetadata;

    @NotNull
    @Column(nullable = false)
    private Integer targetCount;

    @NotNull
    @JsonIgnore
    @Lob
    private String valueToMatchInBase64;

    @JsonGetter(value = "requestMetadata")
    public Map<String, String> getRequestMetadataOverride() throws IOException {
        return new ObjectMapper().readValue(requestMetadata, new TypeReference<HashMap<String, String>>() {
        });
    }

    public void setRequestMetadataOverride(Map<String, String> requestMetadata) throws JsonProcessingException {
        this.requestMetadata = new ObjectMapper().writeValueAsString(requestMetadata);
    }

    @Column(columnDefinition = "TEXT")
    private String results;

    @JsonGetter(value = "results")
    public Map<String, String> getResultsOverride() throws IOException {
        return new ObjectMapper().readValue(results, new TypeReference<HashMap<String, String>>() {
        });
    }

    public void setResultsOverride(Map<String, String> results) throws JsonProcessingException {
        this.results = new ObjectMapper().writeValueAsString(results);
    }

    @OneToMany(mappedBy = "owner", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TrackedList> trackedLists;

    @JsonIgnore
    @ManyToOne
    private User owner;
}
