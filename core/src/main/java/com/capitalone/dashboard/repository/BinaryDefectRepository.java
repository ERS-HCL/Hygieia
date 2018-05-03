package com.capitalone.dashboard.repository;

import com.capitalone.dashboard.model.BinaryDefect;
import org.bson.types.ObjectId;
import org.springframework.data.querydsl.QueryDslPredicateExecutor;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface BinaryDefectRepository extends CrudRepository<BinaryDefect, ObjectId>, QueryDslPredicateExecutor<BinaryDefect> {

        /**
         * Finds the {@link BinaryDefect} data point at the given timestamp for a specific
         * {@link com.capitalone.dashboard.model.CollectorItem}.
         *
         * @param collectorItemId collector item id
         * @param timestamp timestamp
         * @return a {@link BinaryDefect}
         */
        BinaryDefect findByCollectorItemIdAndTimestamp(ObjectId collectorItemId, long timestamp);

        List<BinaryDefect> findByCollectorItemIdAndVersionOrderByTimestampDesc(ObjectId collectorItemId, String version);

       // List<BinaryDefect> findByCollectorItemIdAndNameAndVersionOrderByTimestampDesc(ObjectId collectorItemId, String name, String version);

        List<BinaryDefect> findByCollectorItemIdOrderByTimestampDesc(ObjectId collectorItemId);

   //     List<BinaryDefect> findByNameAndVersion(String name, String version);

       // List<BinaryDefect> findByQueryNameAndVersionOrderByTimestampDesc(String name, String version);

        List<BinaryDefect> findByCollectorItemIdAndTimestampIsBetweenOrderByTimestampDesc(ObjectId collectorItemId, long beginDate, long endDate);
}
