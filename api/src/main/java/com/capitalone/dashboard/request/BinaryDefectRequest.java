package com.capitalone.dashboard.request;

import com.capitalone.dashboard.model.CodeQualityType;
import com.capitalone.dashboard.model.CollectorType;
import org.bson.types.ObjectId;

import javax.validation.constraints.NotNull;

public class BinaryDefectRequest {
    @NotNull
    private ObjectId componentId;
    private Integer max;
    private Integer numberOfDays;
    private Long dateBegins;
    private Long dateEnds;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    private String type;


    public String getQueryURL() {
        return queryURL;
    }

    public void setQueryURL(String queryURL) {
        this.queryURL = queryURL;
    }

    private String queryURL;


    public ObjectId getComponentId() {
        return componentId;
    }

    public void setComponentId(ObjectId componentId) {
        this.componentId = componentId;
    }

    public Integer getMax() {
        return max;
    }

    public void setMax(Integer max) {
        this.max = max;
    }

    public Integer getNumberOfDays() {
        return numberOfDays;
    }

    public void setNumberOfDays(Integer numberOfDays) {
        this.numberOfDays = numberOfDays;
    }

    public Long getDateBegins() {
        return dateBegins;
    }

    public void setDateBegins(Long dateBegins) {
        this.dateBegins = dateBegins;
    }

    public Long getDateEnds() {
        return dateEnds;
    }

    public void setDateEnds(Long dateEnds) {
        this.dateEnds = dateEnds;
    }



    public boolean validDateRange() {
        return dateBegins != null || dateEnds != null;
    }
}
