package com.arcaneiceman.kraken.krakenserver.service.utils;

import com.arcaneiceman.kraken.krakenserver.domain.PasswordList;
import com.arcaneiceman.kraken.krakenserver.domain.PasswordListJobDelimiter;
import com.arcaneiceman.kraken.krakenserver.repository.PasswordListJobDelimiterRepository;
import com.arcaneiceman.kraken.krakenserver.util.exceptions.SystemException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zalando.problem.Status;

@Service
@Transactional
class PasswordListJobDelimiterService {

    private final PasswordListJobDelimiterRepository passwordListJobDelimiterRepository;


    public PasswordListJobDelimiterService(PasswordListJobDelimiterRepository passwordListJobDelimiterRepository) {
        this.passwordListJobDelimiterRepository = passwordListJobDelimiterRepository;
    }

    public PasswordListJobDelimiter create(long jobDelimiterIndex,
                                           Long jobStartMarker,
                                           Long jobOffsetMarker,
                                           PasswordList owner) {
        PasswordListJobDelimiter passwordListJobDelimiter =
                new PasswordListJobDelimiter(null, jobDelimiterIndex, jobStartMarker, jobOffsetMarker, owner);
        return passwordListJobDelimiterRepository.save(passwordListJobDelimiter);
    }

    public PasswordListJobDelimiter get(Long indexNumber, PasswordList owner) {
        return passwordListJobDelimiterRepository.findByIndexNumberAndOwner(indexNumber, owner)
                .orElseThrow(() -> new SystemException(2342, "Could not find Job Delimiter", Status.NOT_FOUND));
    }

    public void delete(PasswordList owner) {
        passwordListJobDelimiterRepository.deleteAll(passwordListJobDelimiterRepository.findByOwner(owner));
    }
}
