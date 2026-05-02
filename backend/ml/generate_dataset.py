"""
Real Data Export for IntentMarketer ML Pipeline
Exports actual Interaction records from MongoDB into training CSV.
Falls back to enhanced synthetic data when insufficient real data exists.
"""

import csv
import random
import json
import os
import sys

random.seed(42)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, 'synthetic_data.csv')

CATEGORIES = ['tech', 'finance', 'travel', 'health', 'education', 'ecommerce']
INTENT_STAGES = ['browsing', 'exploring', 'comparing', 'buying']

FEATURE_NAMES = [
    'pages_visited', 'time_spent', 'scroll_depth', 'category_match',
    'intent_score', 'comparison_count', 'product_views',
    'intent_velocity', 'reread_score', 'engagement_depth', 'hover_rate',
    'max_scroll_depth', 'category_affinity_strength'
]


def try_export_real_data():
    """Try to connect to MongoDB and export real interaction data."""
    try:
        from pymongo import MongoClient
        
        # Try local MongoDB
        client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=3000)
        client.server_info()
        db = client['intentmarketer']
        
        interactions = list(db.interactions.find({'event_type': 'impression'}))
        
        if len(interactions) < 50:
            print(f"[INFO] Only {len(interactions)} real interactions found. Need 50+. Using synthetic data.")
            return None
        
        samples = []
        for inter in interactions:
            sf = inter.get('session_features', {})
            af = inter.get('ad_features', {})
            
            # Get category affinity for this ad's category
            cat_affinity = sf.get('category_affinity', {})
            ad_cat = af.get('category', '')
            affinity_val = cat_affinity.get(ad_cat, 0) if isinstance(cat_affinity, dict) else 0
            
            sample = {
                'pages_visited': min(sf.get('pages_visited', 1), 20),
                'time_spent': min(sf.get('time_spent', 0), 600),
                'scroll_depth': sf.get('scroll_depth', 0),
                'category_match': 1 if affinity_val > 0 else 0,
                'intent_score': sf.get('intent_score', 0),
                'comparison_count': min(sf.get('comparison_count', 0), 10),
                'product_views': min(sf.get('product_views', 0), 10),
                'intent_velocity': sf.get('intent_velocity', 0),
                'reread_score': sf.get('reread_score', 0),
                'engagement_depth': sf.get('engagement_depth', 0),
                'hover_rate': min(sf.get('hover_rate', 0), 10),
                'max_scroll_depth': sf.get('max_scroll_depth', 0),
                'category_affinity_strength': affinity_val,
                'clicked': 1 if inter.get('clicked', False) else 0,
            }
            samples.append(sample)
        
        print(f"[OK] Exported {len(samples)} real interaction records")
        return samples
        
    except Exception as e:
        print(f"[INFO] Cannot connect to MongoDB ({e}). Using synthetic data.")
        return None


def generate_enhanced_sample():
    """Generate one synthetic sample with the enriched feature set."""
    
    pages_visited = random.randint(1, 15)
    time_spent = random.randint(5, 600)
    scroll_depth = round(random.uniform(0.05, 1.0), 2)
    max_scroll_depth = round(min(scroll_depth + random.uniform(0, 0.3), 1.0), 2)
    
    comparison_count = random.randint(0, min(pages_visited, 5))
    product_views = random.randint(0, min(pages_visited, 5))
    
    # New features
    intent_velocity = round(random.uniform(-0.1, 0.3), 3)
    reread_score = round(random.uniform(0, 1.0), 2)
    engagement_depth = round(random.uniform(0, 1.0), 2)
    hover_rate = round(random.uniform(0, 8), 2)
    
    session_category = random.choice(CATEGORIES)
    ad_category = random.choice(CATEGORIES)
    category_match = 1 if session_category == ad_category else 0
    category_affinity_strength = round(random.uniform(0.3, 1.0) if category_match else random.uniform(0, 0.2), 2)
    
    # Calculate intent score (mirror backend logic)
    pages_score = min(pages_visited, 15) / 15
    time_score = 1 - 2.718 ** (-time_spent / 180)
    page_type_score = random.uniform(0.2, 0.9)
    comp_score = min(comparison_count * 0.6 + product_views * 0.4, 5) / 5
    eng_score = engagement_depth
    
    intent_score = round(
        0.10 * pages_score +
        0.12 * time_score +
        0.10 * scroll_depth +
        0.18 * page_type_score +
        0.12 * comp_score +
        0.20 * eng_score +
        0.08 * reread_score +
        0.10 * category_affinity_strength, 2
    )
    intent_score = max(0, min(1, intent_score))
    
    # Click probability (realistic)
    click_prob = 0.03
    
    if category_match:
        click_prob += 0.15 + category_affinity_strength * 0.10
    
    # Intent alignment
    click_prob += intent_score * 0.20
    
    # Engagement signals
    click_prob += engagement_depth * 0.12
    click_prob += reread_score * 0.05
    
    # Velocity boost
    if intent_velocity > 0.1:
        click_prob += 0.08
    
    # Product/comparison behavior
    if comparison_count >= 2 and category_match:
        click_prob += 0.12
    if product_views >= 2 and category_match:
        click_prob += 0.15
    
    # High scroll + high time = engaged reader
    if scroll_depth > 0.7 and time_spent > 120:
        click_prob += 0.06
    
    # Low engagement = low click
    if engagement_depth < 0.15 and not category_match:
        click_prob *= 0.4
    
    click_prob = max(0.01, min(0.92, click_prob))
    clicked = 1 if random.random() < click_prob else 0
    
    return {
        'pages_visited': pages_visited,
        'time_spent': time_spent,
        'scroll_depth': scroll_depth,
        'category_match': category_match,
        'intent_score': intent_score,
        'comparison_count': comparison_count,
        'product_views': product_views,
        'intent_velocity': intent_velocity,
        'reread_score': reread_score,
        'engagement_depth': engagement_depth,
        'hover_rate': hover_rate,
        'max_scroll_depth': max_scroll_depth,
        'category_affinity_strength': category_affinity_strength,
        'clicked': clicked,
    }


def main():
    # Try real data first
    samples = try_export_real_data()
    
    if samples is None:
        # Fall back to enhanced synthetic data
        NUM_SAMPLES = 5000
        print(f"[*] Generating {NUM_SAMPLES} enhanced synthetic samples...")
        samples = [generate_enhanced_sample() for _ in range(NUM_SAMPLES)]
    
    # Write to CSV
    fieldnames = FEATURE_NAMES + ['clicked']
    
    with open(OUTPUT_FILE, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(samples)
    
    total_clicks = sum(s['clicked'] for s in samples)
    click_rate = total_clicks / len(samples) * 100
    
    print(f"[OK] Generated {len(samples)} samples -> {OUTPUT_FILE}")
    print(f"   Click rate: {click_rate:.1f}% ({total_clicks}/{len(samples)})")
    print(f"   Features: {', '.join(FEATURE_NAMES)}")


if __name__ == '__main__':
    main()
