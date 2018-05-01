package com.capitalone.dashboard.repository;

import com.capitalone.dashboard.model.DefectRepo;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;


public interface DefectRepoRepository extends BaseCollectorItemRepository<DefectRepo> {

    @Query(value="{ 'collectorId' : ?0, options.queryURL : ?1, options.userName : ?2}")
    DefectRepo findDefectRepo(ObjectId collectorId, String queryURL, String userName);

    @Query(value="{ 'collectorId' : ?0, options.queryURL : ?1, enabled: true}")
    List<DefectRepo> findEnabledDefectRepos(ObjectId collectorId, String queryURL);

    @Query(value="{ 'collectorId' : ?0,  enabled: true}")
    List<DefectRepo> findDefectByCollectorId(ObjectId collectorId);

}
