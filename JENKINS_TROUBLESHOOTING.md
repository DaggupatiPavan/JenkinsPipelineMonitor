# 🔧 Jenkins Connection Troubleshooting Guide

## 📋 Current Status
- ✅ Jenkins server is accessible at `http://20.121.40.237:8080`
- ✅ Jobs available: `demo`, `freestyle`, `test`, `test2`, `test3`
- ✅ CORS plugin is installed
- ❌ Still failing to connect via the application

## 🎯 Common Issues and Solutions

### **1. CORS Configuration Issues**

#### **Problem**
Even with CORS plugin installed, Jenkins may not be properly configured to allow cross-origin requests from your application.

#### **Solution**
Configure Jenkins CORS properly:

1. **Go to Jenkins Dashboard** → `Manage Jenkins` → `Configure Global Security`
2. **Find CORS section** (should be visible with CORS plugin installed)
3. **Add the following configuration**:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Requested-With
   Access-Control-Max-Age: 3600
   ```
4. **Or for specific domains** (more secure):
   ```
   Access-Control-Allow-Origin: http://localhost:3000
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Requested-With
   ```

### **2. CSRF Protection Issues**

#### **Problem**
Jenkins has CSRF protection enabled that can block API requests.

#### **Solution**
**Option A: Disable CSRF Protection (Not Recommended for Production)**
1. Go to `Manage Jenkins` → `Configure Global Security`
2. Uncheck "Prevent Cross Site Request Forgery exploits"
3. Save and restart Jenkins

**Option B: Configure CSRF Properly (Recommended)**
1. Go to `Manage Jenkins` → `Configure Global Security`
2. Under CSRF Protection, add your application domain to the allowed list
3. Or configure the crumb issuer properly

### **3. Authentication Issues**

#### **Problem**
API token or user permissions may be incorrect.

#### **Solution**
**Verify API Token:**
1. Log in to Jenkins as `admin`
2. Click on your username in top-right corner
3. Click `Configure`
4. Under `API Token`, click `Add new Token`
5. Enter a name (e.g., "pipeline-monitor")
6. Copy the generated token immediately (it won't be shown again)

**Check User Permissions:**
1. Go to `Manage Jenkins` → `Manage and Assign Roles`
2. Ensure your user has `Overall/Read` permission
3. Ensure your user has `Job/Read` permission

### **4. Jenkins Script Console Test**

#### **Test CORS Configuration**
Run this in Jenkins Script Console (`Manage Jenkins` → `Script Console`):

```groovy
// Test CORS headers
import javax.servlet.http.HttpServletResponse

println "Testing CORS configuration..."
response.setHeader('Access-Control-Allow-Origin', '*')
response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
response.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With')
println "CORS headers set"
```

#### **Test API Access**
```groovy
// Test API access
import jenkins.model.Jenkins

println "Jenkins URL: " + Jenkins.instance.getRootUrl()
println "Jobs count: " + Jenkins.instance.getJobs().size()
println "User: " + jenkins.security.SecurityContextHolder.getContext().getAuthentication().getName()
```

### **5. Direct API Testing**

#### **Test with curl**
```bash
# Test basic Jenkins access
curl -I http://20.121.40.237:8080

# Test API with authentication (replace YOUR_API_TOKEN)
curl -u "admin:YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  http://20.121.40.237:8080/api/json?tree=description

# Test jobs endpoint
curl -u "admin:YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  http://20.121.40.237:8080/api/json?tree=jobs[name,url,color,lastBuild[number,url,timestamp,duration,result,building]]
```

#### **Test with Node.js**
Use the debug script I created:
```bash
# Update the API token in debug-jenkins.js
node debug-jenkins.js
```

### **6. Jenkins Plugin Verification**

#### **Required Plugins**
Ensure these plugins are installed and up to date:
- **CORS Plugin** - For cross-origin requests
- **Authorization Strategy** - For proper authentication
- **Matrix Authorization Strategy** - For fine-grained permissions

#### **Check Plugin Versions**
1. Go to `Manage Jenkins` → `Manage Plugins`
2. Check `Installed` tab
3. Verify CORS plugin is installed and up to date
4. Update if necessary

### **7. Network and Firewall Issues**

#### **Check Jenkins Logs**
```bash
# Check Jenkins logs for errors
tail -f /var/log/jenkins/jenkins.log
# Or check in Jenkins UI: Manage Jenkins → System Log
```

#### **Check Network Connectivity**
```bash
# Test from the application server
telnet 20.121.40.237 8080

# Test HTTP access
curl -v http://20.121.40.237:8080
```

### **8. Alternative Solutions**

#### **Option A: Jenkins Reverse Proxy**
Set up a reverse proxy (Nginx/Apache) in front of Jenkins to handle CORS:

```nginx
# Nginx example
server {
    listen 80;
    server_name jenkins.example.com;
    
    location / {
        proxy_pass http://20.121.40.237:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization, X-Requested-With' always;
    }
}
```

#### **Option B: Jenkins Configuration as Code**
Use Jenkins Configuration as Code (JCasC) to manage CORS settings:

```yaml
jenkins:
  systemMessage: "Jenkins configured automatically"
  security:
    cors:
      enabled: true
      allowedOrigins:
        - "*"
      allowedMethods:
        - "GET"
        - "POST"
        - "PUT"
        - "DELETE"
        - "OPTIONS"
      allowedHeaders:
        - "Origin"
        - "Content-Type"
        - "Accept"
        - "Authorization"
        - "X-Requested-With"
```

## 🚀 Quick Fix Checklist

### **Immediate Actions**
1. [ ] **Verify API Token**: Generate a fresh API token
2. [ ] **Test Direct Access**: Try accessing Jenkins API via curl
3. [ ] **Check CORS Settings**: Configure CORS plugin properly
4. [ ] **Disable CSRF**: Temporarily disable CSRF for testing
5. [ ] **Check Permissions**: Verify user has read access

### **Configuration Steps**
1. [ ] **Update CORS Configuration**: Add proper headers
2. [ ] **Configure CSRF**: Either disable or configure properly
3. [ ] **Restart Jenkins**: Apply configuration changes
4. [ ] **Test Again**: Try connecting with the application

### **Advanced Solutions**
1. [ ] **Set Up Reverse Proxy**: For production environments
2. [ ] **Use JCasC**: For configuration management
3. [ ] **Monitor Logs**: Check for ongoing issues
4. [ ] **Update Plugins**: Keep everything up to date

## 📞 Getting Help

If you're still having issues:

1. **Check Jenkins Logs**: Look for specific error messages
2. **Test with curl**: Verify API access works directly
3. **Try Different Browsers**: Some browsers have stricter CORS policies
4. **Check Network**: Ensure no firewalls are blocking requests

## 🎯 Expected Result

After fixing these issues, you should see:
- ✅ Connection successful in the application
- ✅ Jobs listed in the dashboard
- ✅ Real-time monitoring working
- ✅ No CORS or authentication errors

---

**Remember**: Start with the immediate actions first, as they're most likely to resolve the issue!