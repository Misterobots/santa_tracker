import http.server
import socketserver
import json
import os
import time
import threading
from datetime import datetime

PORT = 8001
DATA_FILE = 'stats.json'

# Christmas Day 2025
CHRISTMAS = datetime(2025, 12, 25, 0, 0, 0)

# Target stats for Christmas (all should reach these by Dec 25)
CHRISTMAS_TARGETS = {
    "toysMade": 8_000_000_000,      # 8 billion toys
    "presentsWrapped": 7_800_000_000,
    "cookiesEaten": 100_000_000,    # 100 million cookies
    "elvesWorking": 847_232,        # ~850k elves
    "reindeerReady": 9,             # 9 reindeer
    "sleighCapacity": 100,          # 100%  
    "niceListRatio": 87,            # 87% nice
    "cocoaReserves": 50000,         # 50k liters
    "magicDustLevel": 100           # 100%
}

# Starting values (Dec 1st baseline)
START_DATE = datetime(2025, 12, 1, 0, 0, 0)
START_VALUES = {
    "toysMade": 4_000_000_000,
    "presentsWrapped": 3_500_000_000,
    "cookiesEaten": 50_000_000,
    "elvesWorking": 600_000,
    "reindeerReady": 0,
    "sleighCapacity": 0,
    "niceListRatio": 75,
    "cocoaReserves": 45000,
    "magicDustLevel": 60
}

def calculate_progress_stats():
    """Calculate stats based on progress toward Christmas"""
    now = datetime.now()
    
    # If past Christmas, use target values
    if now >= CHRISTMAS:
        return {
            **CHRISTMAS_TARGETS,
            "isChristmas": True,
            "daysUntilChristmas": 0
        }
    
    # Calculate progress (0.0 to 1.0)
    total_duration = (CHRISTMAS - START_DATE).total_seconds()
    elapsed = (now - START_DATE).total_seconds()
    progress = max(0, min(1, elapsed / total_duration))
    
    # Days until Christmas
    days_remaining = (CHRISTMAS - now).days
    hours_remaining = int((CHRISTMAS - now).seconds / 3600)
    
    # Calculate each stat based on progress
    stats = {}
    for key in CHRISTMAS_TARGETS:
        start = START_VALUES.get(key, 0)
        target = CHRISTMAS_TARGETS[key]
        
        # Add some variation to make it feel "live"
        variance = 1 + (hash(str(now.second) + key) % 100 - 50) / 1000  # ±5%
        
        current = int(start + (target - start) * progress * variance)
        stats[key] = min(current, target)  # Cap at target
    
    # Reindeer ready: stepped (1 ready every ~3 days)
    reindeer_progress = min(9, int(progress * 12))
    stats["reindeerReady"] = reindeer_progress
    
    # Sleigh capacity: ramps up in last week
    if days_remaining <= 7:
        stats["sleighCapacity"] = int((7 - days_remaining) / 7 * 100)
    else:
        stats["sleighCapacity"] = 0
    
    stats["daysUntilChristmas"] = days_remaining
    stats["hoursUntilChristmas"] = hours_remaining
    stats["isChristmas"] = False
    stats["progress"] = round(progress * 100, 1)
    
    return stats

# Live-updating incremental stats (for per-second updates)
incremental_stats = {
    "toysMadeToday": 0,
    "cookiesEatenToday": 0
}

def simulation_loop():
    """Background loop for per-second increments"""
    while True:
        # Add small random increments every second
        incremental_stats["toysMadeToday"] += 1247  # ~1200 toys/sec
        incremental_stats["cookiesEatenToday"] += 3  # 3 cookies/sec
        time.sleep(1)

# Start simulation
threading.Thread(target=simulation_loop, daemon=True).start()

class StatsHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/stats':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Combine calculated progress stats with incremental
            stats = calculate_progress_stats()
            stats.update(incremental_stats)
            
            self.wfile.write(json.dumps(stats).encode())
        elif self.path == '/api/workshop':
            # Detailed workshop stats
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            stats = calculate_progress_stats()
            
            # Add fun workshop-specific details
            workshop_data = {
                **stats,
                "activeShift": "BRAVO" if datetime.now().hour < 12 else "ALPHA",
                "activeSector": f"Sector {(datetime.now().hour % 7) + 1}",
                "wrappingPaperStatus": "LOW" if stats["progress"] > 90 else "OPTIMAL",
                "elfMorale": "HIGH" if stats["niceListRatio"] > 80 else "MODERATE",
                "productionRate": f"{100 + int(stats['progress'] / 10)}%"
            }
            
            self.wfile.write(json.dumps(workshop_data).encode())
        else:
            return http.server.SimpleHTTPRequestHandler.do_GET(self)

print(f"🎄 Starting Santa's Workshop Server on port {PORT}...")
print(f"📊 Stats API: http://localhost:{PORT}/api/stats")
print(f"🛠️  Workshop API: http://localhost:{PORT}/api/workshop")
with socketserver.TCPServer(("", PORT), StatsHandler) as httpd:
    httpd.serve_forever()
