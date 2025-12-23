import http.server
import socketserver
import json
import os
import time
import threading
import random
from datetime import datetime, timedelta

PORT = 8001
DATA_FILE = 'stats.json'

# ============================================
# CHRISTMAS 2025 TIMELINE
# ============================================
# Dec 1-23: Pre-Christmas buildup (production ramping up)
# Dec 24 daytime: Final preparations (all stats at 100%, last checks)
# Dec 24 evening (6PM+): Santa takes flight! Deliveries begin
# Dec 25: Christmas Day - Celebration mode
# Dec 26+: Post-Christmas wind down

YEAR = 2025
START_DATE = datetime(YEAR, 12, 1, 0, 0, 0)      # Production starts ramping
CHRISTMAS_EVE = datetime(YEAR, 12, 24, 0, 0, 0)   # Final prep day
SANTA_DEPARTS = datetime(YEAR, 12, 24, 18, 0, 0)  # 6 PM - Santa leaves!
CHRISTMAS_DAY = datetime(YEAR, 12, 25, 0, 0, 0)   # Midnight Christmas
SANTA_RETURNS = datetime(YEAR, 12, 25, 6, 0, 0)   # 6 AM - Santa home
POST_CHRISTMAS = datetime(YEAR, 12, 26, 0, 0, 0)  # Wind down begins

# Target stats (at 100% completion before Santa departs)
CHRISTMAS_TARGETS = {
    "toysMade": 8_000_000_000,       # 8 billion toys
    "presentsWrapped": 7_800_000_000,
    "presentsLoaded": 7_800_000_000, # All loaded on sleigh
    "cookiesPrepared": 500_000_000,  # Cookies left for Santa worldwide
    "elvesWorking": 847_232,         # ~850k elves at peak
    "reindeerReady": 9,              # All 9 reindeer
    "sleighCapacity": 100,           # Fully loaded
    "niceListRatio": 87,             # 87% nice
    "cocoaReserves": 50_000,         # Liters
    "magicDustLevel": 100,           # Full magic power
    "routeCalculated": 100,          # Route 100% planned
}

# Starting values (Dec 1st baseline)
START_VALUES = {
    "toysMade": 4_000_000_000,
    "presentsWrapped": 3_000_000_000,
    "presentsLoaded": 0,
    "cookiesPrepared": 200_000_000,
    "elvesWorking": 500_000,
    "reindeerReady": 0,
    "sleighCapacity": 0,
    "niceListRatio": 75,
    "cocoaReserves": 35_000,
    "magicDustLevel": 50,
    "routeCalculated": 0,
}

def get_christmas_phase(now=None):
    """Determine which phase of Christmas we're in"""
    if now is None:
        now = datetime.now()
    
    if now < START_DATE:
        return "pre_season"
    elif now < CHRISTMAS_EVE:
        return "production"       # Dec 1-23: Making toys
    elif now < SANTA_DEPARTS:
        return "final_prep"       # Dec 24 daytime: Final checks
    elif now < CHRISTMAS_DAY:
        return "delivering"       # Dec 24 evening: Santa flying!
    elif now < SANTA_RETURNS:
        return "delivering"       # Dec 25 early AM: Still delivering
    elif now < POST_CHRISTMAS:
        return "christmas_day"    # Dec 25: Celebration!
    else:
        return "post_christmas"   # Dec 26+: Rest & celebration

def calculate_progress_stats():
    """Calculate stats based on progress toward Christmas"""
    now = datetime.now()
    phase = get_christmas_phase(now)
    
    # Time calculations
    days_remaining = max(0, (CHRISTMAS_DAY - now).days)
    hours_remaining = max(0, int((CHRISTMAS_DAY - now).total_seconds() / 3600))
    minutes_remaining = max(0, int((CHRISTMAS_DAY - now).total_seconds() / 60) % 60)
    seconds_remaining = max(0, int((CHRISTMAS_DAY - now).total_seconds()) % 60)
    
    stats = {
        "phase": phase,
        "daysUntilChristmas": days_remaining,
        "hoursUntilChristmas": hours_remaining,
        "minutesUntilChristmas": minutes_remaining,
        "secondsUntilChristmas": seconds_remaining,
        "isChristmas": phase in ["christmas_day", "post_christmas"],
        "isSantaFlying": phase == "delivering",
    }
    
    # ============================================
    # PHASE-SPECIFIC STATS CALCULATION
    # ============================================
    
    if phase == "pre_season":
        # Before Dec 1 - minimal activity
        for key in CHRISTMAS_TARGETS:
            stats[key] = int(START_VALUES.get(key, 0) * 0.5)
        stats["progress"] = 0
        stats["statusMessage"] = "Workshop opening soon..."
        stats["elvesWorking"] = 100_000  # Skeleton crew
        
    elif phase == "production":
        # Dec 1-23: Ramp up production
        total_production_time = (CHRISTMAS_EVE - START_DATE).total_seconds()
        elapsed = (now - START_DATE).total_seconds()
        progress = min(1.0, elapsed / total_production_time)
        
        # Exponential ramp-up (starts slow, accelerates toward the end)
        # Use easing function: starts at 0, ends at 1, curves upward
        eased_progress = 1 - pow(1 - progress, 2)  # Ease out quad
        
        for key in CHRISTMAS_TARGETS:
            start = START_VALUES.get(key, 0)
            target = CHRISTMAS_TARGETS[key]
            
            # Add small variance for "live" feel
            variance = 1 + (hash(str(now.second) + key) % 100 - 50) / 5000
            
            current = int(start + (target - start) * eased_progress * variance)
            stats[key] = min(current, target)
        
        # Reindeer ready: stepped (1 ready every ~2.5 days starting Dec 1)
        days_elapsed = (now - START_DATE).days
        stats["reindeerReady"] = min(9, max(0, int(days_elapsed / 2.5)))
        
        # Sleigh loading: only starts in last 3 days
        if days_remaining <= 3:
            stats["sleighCapacity"] = int((3 - days_remaining) / 3 * 100)
            stats["presentsLoaded"] = int(stats["presentsWrapped"] * stats["sleighCapacity"] / 100)
        else:
            stats["sleighCapacity"] = 0
            stats["presentsLoaded"] = 0
        
        stats["progress"] = round(eased_progress * 100, 1)
        stats["statusMessage"] = f"Production at {stats['progress']}%"
        
    elif phase == "final_prep":
        # Dec 24 daytime: Everything at 100%, final checks
        for key in CHRISTMAS_TARGETS:
            stats[key] = CHRISTMAS_TARGETS[key]
        
        # Calculate hours until Santa departs
        hours_until_departure = max(0, (SANTA_DEPARTS - now).total_seconds() / 3600)
        stats["hoursUntilDeparture"] = round(hours_until_departure, 1)
        stats["progress"] = 100
        stats["statusMessage"] = f"Final checks! Santa departs in {int(hours_until_departure)}h {int((hours_until_departure % 1) * 60)}m"
        stats["sleighCapacity"] = 100
        stats["presentsLoaded"] = CHRISTMAS_TARGETS["presentsWrapped"]
        
    elif phase == "delivering":
        # Santa is flying! Dynamic delivery stats
        if now < CHRISTMAS_DAY:
            # Dec 24 evening (6PM - midnight)
            flight_progress = (now - SANTA_DEPARTS).total_seconds() / (CHRISTMAS_DAY - SANTA_DEPARTS).total_seconds()
        else:
            # Dec 25 early morning (midnight - 6AM)
            flight_progress = 0.5 + (now - CHRISTMAS_DAY).total_seconds() / (SANTA_RETURNS - CHRISTMAS_DAY).total_seconds() * 0.5
        
        flight_progress = min(1.0, max(0, flight_progress))
        
        # All production complete
        for key in CHRISTMAS_TARGETS:
            stats[key] = CHRISTMAS_TARGETS[key]
        
        # Delivery-specific stats
        total_presents = CHRISTMAS_TARGETS["presentsWrapped"]
        stats["presentsDelivered"] = int(total_presents * flight_progress)
        stats["presentsRemaining"] = total_presents - stats["presentsDelivered"]
        stats["sleighCapacity"] = int(100 * (1 - flight_progress))  # Sleigh empties as he delivers
        
        # Cookies eaten during flight (Santa eats them!)
        total_cookies = CHRISTMAS_TARGETS["cookiesPrepared"]
        stats["cookiesEaten"] = int(total_cookies * flight_progress * 0.9)  # 90% get eaten
        
        # Milk drunk
        stats["milkDrunk"] = int(stats["cookiesEaten"] * 0.2)  # 0.2L per cookie
        
        # Carrots for reindeer
        stats["carrotsEaten"] = int(flight_progress * 800_000_000 * 9)  # Reindeer snacks
        
        # Distance flown (Earth circumference is ~40,000 km, Santa flies ~500 million km)
        stats["distanceFlown"] = int(flight_progress * 500_000_000)
        
        # Homes visited
        stats["homesVisited"] = int(flight_progress * 500_000_000)  # 500M homes
        
        stats["progress"] = round(flight_progress * 100, 1)
        stats["statusMessage"] = f"🎅 SANTA IS FLYING! {stats['progress']}% delivered!"
        stats["isSantaFlying"] = True
        
    elif phase == "christmas_day":
        # Christmas morning!
        for key in CHRISTMAS_TARGETS:
            stats[key] = CHRISTMAS_TARGETS[key]
        
        stats["presentsDelivered"] = CHRISTMAS_TARGETS["presentsWrapped"]
        stats["presentsRemaining"] = 0
        stats["cookiesEaten"] = int(CHRISTMAS_TARGETS["cookiesPrepared"] * 0.9)
        stats["milkDrunk"] = int(stats["cookiesEaten"] * 0.2)
        stats["carrotsEaten"] = 800_000_000 * 9
        stats["distanceFlown"] = 500_000_000
        stats["homesVisited"] = 500_000_000
        stats["sleighCapacity"] = 0  # Empty!
        stats["progress"] = 100
        stats["statusMessage"] = "🎄 MERRY CHRISTMAS! Mission Complete! 🎄"
        stats["elvesWorking"] = 50_000  # Skeleton crew, most resting
        
    else:  # post_christmas
        # Wind down
        days_after = (now - POST_CHRISTMAS).days
        wind_down = max(0, 1 - days_after / 7)  # Ramp down over a week
        
        stats["toysMade"] = 0  # Reset
        stats["presentsWrapped"] = 0
        stats["presentsLoaded"] = 0
        stats["presentsDelivered"] = int(CHRISTMAS_TARGETS["presentsWrapped"] * wind_down)
        stats["cookiesEaten"] = int(CHRISTMAS_TARGETS["cookiesPrepared"] * 0.9)
        stats["elvesWorking"] = int(100_000 * wind_down)  # Most on vacation
        stats["reindeerReady"] = 0  # Resting
        stats["sleighCapacity"] = 0
        stats["niceListRatio"] = 50  # Reset for next year
        stats["cocoaReserves"] = int(20_000 * wind_down)
        stats["magicDustLevel"] = int(30 * wind_down)
        stats["routeCalculated"] = 0  # Reset
        stats["progress"] = 100
        stats["statusMessage"] = "Workshop winding down... see you next year! 🎅"
    
    return stats

# Live-updating incremental stats (for per-second updates)
incremental_stats = {
    "toysMadeToday": 0,
    "cookiesEatenToday": 0,
    "lastUpdate": time.time()
}

def simulation_loop():
    """Background loop for per-second increments"""
    while True:
        phase = get_christmas_phase()
        
        # Only increment during production phase
        if phase == "production":
            # Add small random increments every second
            incremental_stats["toysMadeToday"] += random.randint(1000, 1500)
            incremental_stats["cookiesEatenToday"] += random.randint(1, 5)
        elif phase == "delivering":
            # Cookies being eaten during delivery
            incremental_stats["cookiesEatenToday"] += random.randint(50, 200)
        
        incremental_stats["lastUpdate"] = time.time()
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
            
        elif self.path.startswith('/api/workshop'):
            # Detailed workshop stats
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            stats = calculate_progress_stats()
            phase = stats.get("phase", "production")
            
            # Shift based on time of day
            hour = datetime.now().hour
            if hour < 6:
                shift = "OVERNIGHT"
            elif hour < 12:
                shift = "MORNING"
            elif hour < 18:
                shift = "AFTERNOON"
            else:
                shift = "EVENING"
            
            # Sector rotation
            sector = f"Sector {(hour % 7) + 1}"
            
            # Workshop status messages
            if phase == "delivering":
                workshop_status = "SANTA IS FLYING!"
                elf_morale = "CHEERING"
            elif phase == "christmas_day":
                workshop_status = "MERRY CHRISTMAS!"
                elf_morale = "CELEBRATING"
            elif phase == "final_prep":
                workshop_status = "FINAL CHECKS"
                elf_morale = "EXCITED"
            elif phase == "post_christmas":
                workshop_status = "VACATION MODE"
                elf_morale = "RELAXED"
            else:
                # Regular production
                progress = stats.get("progress", 0)
                if progress > 90:
                    workshop_status = "CRUNCH TIME"
                    elf_morale = "FOCUSED"
                elif progress > 70:
                    workshop_status = "HIGH GEAR"
                    elf_morale = "ENERGETIC"
                elif progress > 50:
                    workshop_status = "ON TRACK"
                    elf_morale = "HAPPY"
                else:
                    workshop_status = "RAMPING UP"
                    elf_morale = "CHEERFUL"
            
            workshop_data = {
                **stats,
                "activeShift": shift,
                "activeSector": sector,
                "workshopStatus": workshop_status,
                "wrappingPaperStatus": "LOW" if stats.get("progress", 0) > 95 else "OPTIMAL",
                "elfMorale": elf_morale,
                "productionRate": f"{100 + int(stats.get('progress', 0) / 10)}%" if phase == "production" else "N/A"
            }
            
            self.wfile.write(json.dumps(workshop_data).encode())
            
        elif self.path.startswith('/api/santa/info'):
            # Santa tracking API (for logistics page)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            stats = calculate_progress_stats()
            phase = stats.get("phase", "production")
            
            if phase == "delivering":
                # Santa is flying! Return real-ish tracking data
                progress = stats.get("progress", 0) / 100
                
                # Simulate location based on flight progress
                locations = [
                    ("North Pole", "Arctic", 90.0, 0.0),
                    ("Reykjavik", "Iceland", 64.1, -21.9),
                    ("London", "United Kingdom", 51.5, -0.1),
                    ("Paris", "France", 48.9, 2.4),
                    ("Moscow", "Russia", 55.8, 37.6),
                    ("Dubai", "UAE", 25.2, 55.3),
                    ("Mumbai", "India", 19.1, 72.9),
                    ("Beijing", "China", 39.9, 116.4),
                    ("Tokyo", "Japan", 35.7, 139.7),
                    ("Sydney", "Australia", -33.9, 151.2),
                    ("Honolulu", "Hawaii", 21.3, -157.9),
                    ("Los Angeles", "USA", 34.1, -118.2),
                    ("New York", "USA", 40.7, -74.0),
                    ("São Paulo", "Brazil", -23.5, -46.6),
                    ("North Pole", "Home!", 90.0, 0.0),
                ]
                
                idx = int(progress * (len(locations) - 1))
                idx = min(idx, len(locations) - 2)
                current = locations[idx]
                next_loc = locations[idx + 1]
                
                santa_data = {
                    "location": current[0],
                    "country": current[1],
                    "region": current[1],
                    "lat": current[2],
                    "lng": current[3],
                    "next": {
                        "city": next_loc[0],
                        "region": next_loc[1],
                        "arrival": (datetime.now() + timedelta(minutes=random.randint(5, 30))).isoformat()
                    },
                    "presentsDelivered": stats.get("presentsDelivered", 0),
                    "distance": stats.get("distanceFlown", 0) * 1000,  # Convert to meters
                    "status": "FLYING",
                    "speed": f"{random.randint(5000, 8000)} km/h"
                }
            elif phase == "christmas_day":
                santa_data = {
                    "location": "North Pole",
                    "country": "Home Sweet Home",
                    "region": "Workshop",
                    "presentsDelivered": stats.get("presentsDelivered", CHRISTMAS_TARGETS["presentsWrapped"]),
                    "distance": 500_000_000_000,  # Full trip in meters
                    "status": "MISSION COMPLETE",
                    "next": None
                }
            else:
                # Pre-flight - Santa at North Pole preparing
                hours_until = stats.get("hoursUntilChristmas", 0)
                santa_data = {
                    "location": "North Pole",
                    "country": "Workshop",
                    "region": "Command Center",
                    "presentsDelivered": 0,
                    "distance": 0,
                    "status": "PREPARING" if phase == "final_prep" else "AT WORKSHOP",
                    "next": None,
                    "message": f"Santa departs in approximately {hours_until} hours!" if hours_until > 0 else "Standby..."
                }
            
            self.wfile.write(json.dumps(santa_data).encode())
            
        else:
            return http.server.SimpleHTTPRequestHandler.do_GET(self)

print(f"🎄 Starting Santa's Workshop Server on port {PORT}...")
print(f"📊 Stats API: http://localhost:{PORT}/api/stats")
print(f"🛠️  Workshop API: http://localhost:{PORT}/api/workshop")  
print(f"🎅 Santa Tracker API: http://localhost:{PORT}/api/santa/info")
with socketserver.TCPServer(("", PORT), StatsHandler) as httpd:
    httpd.serve_forever()
