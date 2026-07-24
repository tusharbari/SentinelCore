import time
import os
import socket
import platform
import uuid
import getpass
import psutil
import requests
from datetime import datetime

BACKEND_URL = "http://localhost:8080/api"

def get_ip_address():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def get_mac_address():
    mac_num = uuid.getnode()
    mac = ':'.join(('%012X' % mac_num)[i:i+2] for i in range(0, 12, 2))
    return mac

def get_device_type():
    try:
        if hasattr(psutil, "sensors_battery") and psutil.sensors_battery() is not None:
            return "Laptop"
    except Exception:
        pass
    
    system = platform.system()
    if system == "Linux" or "server" in platform.platform().lower():
        return "Server"
    return "Workstation"

def collect_static_info():
    hostname = socket.gethostname()
    username = getpass.getuser()
    system = platform.system()
    # Friendly mapping for OS
    if system == "Darwin":
        os_name = "macOS"
    else:
        os_name = system
        
    os_version = platform.release()
    ip_addr = get_ip_address()
    mac_addr = get_mac_address()
    device_type = get_device_type()
    
    total_ram = round(psutil.virtual_memory().total / (1024 ** 3), 2)
    
    disk_path = 'C:\\' if os.name == 'nt' else '/'
    try:
        disk_info = psutil.disk_usage(disk_path)
        total_storage = round(disk_info.total / (1024 ** 3), 2)
        free_storage = round(disk_info.free / (1024 ** 3), 2)
    except Exception:
        total_storage = 0.0
        free_storage = 0.0
        
    return {
        "hostname": hostname,
        "assetName": f"{hostname}-Agent",
        "ipAddress": ip_addr,
        "macAddress": mac_addr,
        "operatingSystem": os_name,
        "osVersion": os_version,
        "deviceType": device_type,
        "owner": username,
        "totalRam": total_ram,
        "totalStorage": total_storage,
        "freeStorage": free_storage,
        "status": "ONLINE"
    }

def collect_dynamic_metrics():
    # cpu_percent interval=1 blocks for 1 second to calculate accurately
    cpu_usage = psutil.cpu_percent(interval=1)
    ram_usage = psutil.virtual_memory().percent
    
    disk_path = 'C:\\' if os.name == 'nt' else '/'
    try:
        disk_usage = psutil.disk_usage(disk_path).percent
    except Exception:
        disk_usage = 0.0
        
    return {
        "cpuUsage": cpu_usage,
        "ramUsage": ram_usage,
        "diskUsage": disk_usage
    }

def register_agent():
    print("[*] Gathering system information...")
    payload = collect_static_info()
    print(f"[*] Registering device: {payload['hostname']} ({payload['macAddress']})")
    
    while True:
        try:
            response = requests.post(f"{BACKEND_URL}/assets/register", json=payload)
            if response.status_code == 200 or response.status_code == 201:
                print("[+] Registration successful!")
                return payload
            else:
                print(f"[-] Registration failed with status code {response.status_code}: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"[-] Connection to backend failed: {e}")
        
        print("[*] Retrying registration in 5 seconds...")
        time.sleep(5)

def main():
    print("=== SentinelCore Real-time Monitoring Agent ===")
    static_info = register_agent()
    
    print("[*] Starting monitoring loop (heartbeat interval: 30 seconds)...")
    while True:
        try:
            metrics = collect_dynamic_metrics()
            payload = {
                "hostname": static_info["hostname"],
                "macAddress": static_info["macAddress"],
                "cpuUsage": metrics["cpuUsage"],
                "ramUsage": metrics["ramUsage"],
                "diskUsage": metrics["diskUsage"]
            }
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Sending heartbeat: CPU={payload['cpuUsage']}%, RAM={payload['ramUsage']}%, Disk={payload['diskUsage']}%")
            response = requests.post(f"{BACKEND_URL}/assets/heartbeat", json=payload)
            
            if response.status_code == 404:
                print("[-] Server returned 404 for heartbeat. Attempting to re-register...")
                static_info = register_agent()
            elif response.status_code != 200:
                print(f"[-] Heartbeat failed with status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"[-] Network connection error during heartbeat: {e}")
            
        time.sleep(29) # Sleep for 29s (plus ~1s CPU sampling gives exactly 30s)

if __name__ == "__main__":
    main()
