package com.arcaneiceman.kraken.krakenserver.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;

@EqualsAndHashCode(callSuper = false, of = "indexNumber")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
@Table(name = "password_lists_job_delimiter")
@Entity
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
public class PasswordListJobDelimiter implements Serializable {

    /**
     * Using synthetic key to avoid repeating data
     */
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    private String id;

    @Column
    private Long indexNumber;

    @Column
    private Long startByte;

    @Column
    private Long endByte;

    @JsonIgnore
    @ManyToOne
    private PasswordList owner;
}
