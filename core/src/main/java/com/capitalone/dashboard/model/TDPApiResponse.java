package com.capitalone.dashboard.model;

import java.util.List;

/**
 * Created by begin.samuel on 24-04-2018.
 */
public class TDPApiResponse {


    public List<Defect> getDetail() {
        return detail;
    }

    public void setDetail(List<Defect> detail) {
        this.detail = detail;
    }

    private List<Defect> detail;

    public BreakUp getCategories() {
        return categories;
    }

    public void setCategories(BreakUp categories) {
        this.categories = categories;
    }

    public List<String> getLast10Days() {
        return last10Days;
    }

    public void setLast10Days(List<String> last10Days) {
        this.last10Days = last10Days;
    }

    public List<String> getLast5Days() {
        return last5Days;
    }

    public void setLast5Days(List<String> last5Days) {
        this.last5Days = last5Days;
    }

    public List<String> getLast20Days() {
        return last20Days;
    }

    public void setLast20Days(List<String> last20Days) {
        this.last20Days = last20Days;
    }

    public BreakUp getSeverities() {
        return severities;
    }

    public void setSeverities(BreakUp severities) {
        this.severities = severities;
    }

    public BreakUp getPriorities() {
        return priorities;
    }

    public void setPriorities(BreakUp priorities) {
        this.priorities = priorities;
    }

    public List<String> getLast2Days() {
        return last2Days;
    }

    public void setLast2Days(List<String> last2Days) {
        this.last2Days = last2Days;
    }


    private BreakUp  categories;
    private BreakUp  severities;
    private BreakUp  priorities;
    private List<String> last2Days;
    private List<String> last5Days;
    private List<String> last10Days;
    private List<String> last20Days;
}
