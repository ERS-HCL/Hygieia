package com.capitalone.dashboard.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import java.util.regex.Pattern;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.runners.MockitoJUnitRunner;

import com.capitalone.dashboard.model.BinaryDefect;

@RunWith(MockitoJUnitRunner.class)
public class DefectUtilTest {
	public static final String IVY_PATTERN1 = "(?<group>.+)/(?<module>[^/]+)/(?<version>[^/]+)/(?<artifact>ivy)-\\k<version>(-(?<classifier>[^\\.]+))?\\.(?<ext>xml)";
	public static final String IVY_ARTIFACT_PATTERN1 = "(?<group>.+)/(?<module>[^/]+)/(?<version>[^/]+)/(?<type>[^/]+)/(?<artifact>[^\\.-/]+)-\\k<version>(-(?<classifier>[^\\.]+))?(\\.(?<ext>.+))?";
	
	public static final String MAVEN_PATTERN1 = "(?<group>.+)/(?<module>[^/]+)/(?<version>[^/]+)/(?<artifact>\\k<module>)-\\k<version>(-(?<classifier>[^\\.]+))?(\\.(?<ext>.+))?";
	
	public static final String MISC_PATTERN1 = "(?<group>.+)/([^/]+)/(?<artifact>[^\\.-/]+)-(?<version>[^/]+)\\.(?<ext>zip)";
	public static final String MISC_PATTERN2 = "(?<group>.+)/(?<buildnumber>\\d+)/([^/]+/)*(?<artifact>[^\\./]+)-(?<version>[^/]+)\\.(?<ext>zip)";


}
