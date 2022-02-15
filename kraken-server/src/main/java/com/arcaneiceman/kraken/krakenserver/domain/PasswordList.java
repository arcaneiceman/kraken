package com.arcaneiceman.kraken.krakenserver.domain;

import lombok.*;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

/**
 * Created by Wali on 4/21/2018.
 */
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@EqualsAndHashCode
@Entity
@Table(name = "password_lists")
@Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
public class PasswordList {

    @Id
    private String name;

    @Column
    private Long jobDelimiterSetSize;

    @Column
    private String charset;

    @Column
    private String jobSize;
}
