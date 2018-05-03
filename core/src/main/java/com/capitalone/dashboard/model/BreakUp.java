package com.capitalone.dashboard.model;

import java.io.Serializable;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by begin.samuel on 24-04-2018.
 */
public class BreakUp implements Serializable{

    public BreakUp(){

    }

    public Map<String, String> getInfo() {
        return info;
    }

    public void setInfo(Map<String, String> info) {
        this.info = info;
    }


    public Map<String, Map<String, List<String>>> getDetail() {
        return detail;
    }

    public void setDetail(Map<String, Map<String, List<String>>> detail) {
        this.detail = detail;
    }

    private Map<String,Map<String,List<String>>>  detail = new HashMap<String,Map<String,List<String>>>();
    private Map<String,String>  info = new HashMap<String,String>();


}
