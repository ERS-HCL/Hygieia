package com.capitalone.dashboard.model;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.*;

/**
 * Binary artifacts produced by build jobs and stored in an artifact repository.
 *
 * Possible collectors:
 *  Nexus (in scope)
 *  Artifactory
 *  npm
 *  nuget
 *  rubygems
 *
 */
@Document(collection="tdp_defects")
public class BinaryDefect extends BaseModel {

    public ObjectId getCollectorItemId() {
        return collectorItemId;
    }

    public void setCollectorItemId(ObjectId collectorItemId) {
        this.collectorItemId = collectorItemId;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public String getQueryName() {
        return queryName;
    }

    public void setQueryName(String queryName) {
        this.queryName = queryName;
    }

    public String getQueryURL() {
        return queryURL;
    }

    public void setQueryURL(String queryURL) {
        this.queryURL = queryURL;
    }


    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }



    private ObjectId collectorItemId;
    private long timestamp;
    private String queryName;
    private String queryURL;
    private String version;
    private String username;

    public TDPApiResponse getDefectAnalysis() {
        return defectAnalysis;
    }

    public void setDefectAnalysis(TDPApiResponse defectAnalysis) {
        this.defectAnalysis = defectAnalysis;
    }

    private TDPApiResponse defectAnalysis;


    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    private String secretKey;

    public String getTeam() {
        return team;
    }

    public void setTeam(String team) {
        this.team = team;
    }

    private String team;
}
