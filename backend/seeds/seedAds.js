/**
 * Seed script — creates sample ads for demo purposes
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const connectDB = require('../config/db');
const Ad = require('../models/Ad');
const AdMetric = require('../models/AdMetric');
const Session = require('../models/Session');
const Interaction = require('../models/Interaction');
const User = require('../models/User');

const sampleAds = [
  {
    title: 'MacBook Pro M4 — Ultimate Performance',
    description: 'Experience the next generation of computing with Apple MacBook Pro M4. Blazing fast performance, stunning Liquid Retina XDR display, and all-day battery life. Perfect for developers, creators, and professionals.',
    category: 'tech',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=250&fit=crop',
    advertiser_name: 'Apple Store',
    cta_text: 'Shop Now',
    cta_url: '#',
    extracted_features: {
      product: 'MacBook Pro M4',
      category: 'tech',
      brand: 'Apple',
      price_range: 'premium',
      attributes: ['laptop', 'performance', 'professional', 'M4 chip', 'Retina display'],
      target_intent: 'potential buyer',
      keywords: ['macbook', 'laptop', 'apple', 'pro', 'developer', 'performance', 'computer'],
      summary: 'High-performance laptop for professionals and creators',
    },
  },
  {
    title: 'Wealthfront — Invest Smarter with AI',
    description: 'Let AI manage your investments. Wealthfront uses advanced algorithms to build and manage a diversified portfolio tailored to your goals. Start with as little as $500.',
    category: 'finance',
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
    advertiser_name: 'Wealthfront',
    cta_text: 'Start Investing',
    cta_url: '#',
    extracted_features: {
      product: 'Wealthfront Investment Platform',
      category: 'finance',
      brand: 'Wealthfront',
      price_range: 'mid_range',
      attributes: ['investing', 'AI-powered', 'portfolio management', 'automated'],
      target_intent: 'exploring',
      keywords: ['invest', 'portfolio', 'wealth', 'stock', 'money', 'finance', 'ai', 'automated'],
      summary: 'AI-powered automated investment management platform',
    },
  },
  {
    title: 'Bali Dream Vacation — 7 Days Package',
    description: 'Escape to paradise with our all-inclusive Bali vacation package. Luxury resorts, temple tours, beach activities, and authentic cuisine. Book now and save 30%.',
    category: 'travel',
    image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=250&fit=crop',
    advertiser_name: 'TravelMax',
    cta_text: 'Book Now',
    cta_url: '#',
    extracted_features: {
      product: 'Bali Vacation Package',
      category: 'travel',
      brand: 'TravelMax',
      price_range: 'mid_range',
      attributes: ['vacation', 'luxury', 'beach', 'all-inclusive', 'resort'],
      target_intent: 'potential buyer',
      keywords: ['bali', 'vacation', 'travel', 'resort', 'beach', 'trip', 'holiday', 'booking'],
      summary: 'All-inclusive luxury Bali vacation package with 30% discount',
    },
  },
  {
    title: 'Coursera Plus — Unlimited Learning',
    description: 'Access 7,000+ courses from top universities and companies. Learn data science, business, technology, and more. One subscription, unlimited possibilities.',
    category: 'education',
    image_url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=250&fit=crop',
    advertiser_name: 'Coursera',
    cta_text: 'Start Free Trial',
    cta_url: '#',
    extracted_features: {
      product: 'Coursera Plus Subscription',
      category: 'education',
      brand: 'Coursera',
      price_range: 'mid_range',
      attributes: ['online courses', 'university', 'certification', 'data science'],
      target_intent: 'exploring',
      keywords: ['course', 'learn', 'education', 'certification', 'online', 'university', 'skill', 'data science'],
      summary: 'Unlimited access to online courses from top universities',
    },
  },
  {
    title: 'Samsung Galaxy S25 Ultra — AI Phone',
    description: 'The most intelligent smartphone ever. Galaxy AI features, 200MP camera, S Pen integration, and titanium build. Pre-order now with free Galaxy Buds.',
    category: 'tech',
    image_url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=250&fit=crop',
    advertiser_name: 'Samsung',
    cta_text: 'Pre-Order',
    cta_url: '#',
    extracted_features: {
      product: 'Samsung Galaxy S25 Ultra',
      category: 'tech',
      brand: 'Samsung',
      price_range: 'premium',
      attributes: ['smartphone', 'AI features', '200MP camera', 'titanium', 'S Pen'],
      target_intent: 'potential buyer',
      keywords: ['samsung', 'galaxy', 'phone', 'smartphone', 'camera', 'ai', 'mobile', 'android'],
      summary: 'AI-powered flagship smartphone with premium features',
    },
  },
  {
    title: 'Peloton Fitness — Transform Your Life',
    description: 'World-class workouts at home. Join millions of members with Peloton bike, tread, and app. Classes led by top instructors. 30-day free trial.',
    category: 'health',
    image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=250&fit=crop',
    advertiser_name: 'Peloton',
    cta_text: 'Try Free',
    cta_url: '#',
    extracted_features: {
      product: 'Peloton Fitness Equipment',
      category: 'health',
      brand: 'Peloton',
      price_range: 'premium',
      attributes: ['fitness', 'home workout', 'cycling', 'classes', 'connected'],
      target_intent: 'comparison shopper',
      keywords: ['fitness', 'workout', 'exercise', 'health', 'bike', 'home gym', 'peloton'],
      summary: 'Premium home fitness equipment with live and on-demand classes',
    },
  },
  {
    title: 'Stripe — Payments Infrastructure',
    description: 'Build a complete payment solution with Stripe. Accept payments online, in-app, and in-person. Trusted by millions of businesses worldwide.',
    category: 'tech',
    image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop',
    advertiser_name: 'Stripe',
    cta_text: 'Get Started',
    cta_url: '#',
    extracted_features: {
      product: 'Stripe Payment Platform',
      category: 'tech',
      brand: 'Stripe',
      price_range: 'mid_range',
      attributes: ['payments', 'API', 'developer tools', 'SaaS', 'fintech'],
      target_intent: 'exploring',
      keywords: ['payment', 'stripe', 'api', 'developer', 'saas', 'fintech', 'business', 'online payment'],
      summary: 'Developer-first payment infrastructure for internet businesses',
    },
  },
  {
    title: 'Airbnb Experiences — Unique Stays',
    description: 'Discover unique homes and experiences around the world. From treehouse stays to cooking classes with locals. Your next adventure awaits.',
    category: 'travel',
    image_url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=250&fit=crop',
    advertiser_name: 'Airbnb',
    cta_text: 'Explore',
    cta_url: '#',
    extracted_features: {
      product: 'Airbnb Experiences',
      category: 'travel',
      brand: 'Airbnb',
      price_range: 'mid_range',
      attributes: ['unique stays', 'experiences', 'local', 'adventure', 'accommodation'],
      target_intent: 'exploring',
      keywords: ['airbnb', 'travel', 'stay', 'vacation', 'hotel', 'experience', 'booking', 'destination'],
      summary: 'Unique accommodation and local experiences worldwide',
    },
  },
  // ──── Additional Ads ────
  {
    title: 'Notion — All-in-One Workspace',
    description: 'Replace your scattered tools with one unified workspace. Notes, docs, wikis, project management, and AI assistance — all in Notion. Trusted by startups and Fortune 500s alike.',
    category: 'tech',
    image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&h=250&fit=crop',
    advertiser_name: 'Notion',
    cta_text: 'Try Free',
    cta_url: '#',
    extracted_features: {
      product: 'Notion Workspace',
      category: 'tech',
      brand: 'Notion',
      price_range: 'mid_range',
      attributes: ['productivity', 'workspace', 'docs', 'project management', 'AI'],
      target_intent: 'exploring',
      keywords: ['notion', 'productivity', 'workspace', 'docs', 'project', 'notes', 'wiki', 'team'],
      summary: 'All-in-one workspace for notes, docs, and project management',
    },
  },
  {
    title: 'ASUS ROG Strix — Built for Gamers',
    description: 'Dominate every game with the ASUS ROG Strix gaming laptop. RTX 4090, 240Hz display, per-key RGB, and advanced liquid cooling. The ultimate gaming machine.',
    category: 'tech',
    image_url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=250&fit=crop',
    advertiser_name: 'ASUS',
    cta_text: 'Buy Now',
    cta_url: '#',
    extracted_features: {
      product: 'ASUS ROG Strix Gaming Laptop',
      category: 'tech',
      brand: 'ASUS',
      price_range: 'premium',
      attributes: ['gaming', 'laptop', 'RTX 4090', '240Hz', 'RGB'],
      target_intent: 'potential buyer',
      keywords: ['asus', 'rog', 'gaming', 'laptop', 'rtx', 'gpu', 'game', 'strix', 'computer'],
      summary: 'High-end gaming laptop with RTX 4090 and 240Hz display',
    },
  },
  {
    title: 'Vercel — Deploy at the Edge',
    description: 'Ship web applications with zero configuration. Vercel provides the best developer experience for deploying Next.js, React, and any frontend framework globally.',
    category: 'tech',
    image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop',
    advertiser_name: 'Vercel',
    cta_text: 'Start Deploying',
    cta_url: '#',
    extracted_features: {
      product: 'Vercel Platform',
      category: 'tech',
      brand: 'Vercel',
      price_range: 'mid_range',
      attributes: ['deployment', 'edge', 'Next.js', 'serverless', 'CDN'],
      target_intent: 'exploring',
      keywords: ['vercel', 'deploy', 'nextjs', 'react', 'hosting', 'edge', 'developer', 'framework', 'serverless'],
      summary: 'Frontend cloud platform for deploying web applications globally',
    },
  },
  {
    title: 'Coinbase — Buy & Sell Crypto Safely',
    description: 'The most trusted cryptocurrency exchange. Buy Bitcoin, Ethereum, and 200+ cryptocurrencies. Insured custody, advanced trading tools, and earn rewards.',
    category: 'finance',
    image_url: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=250&fit=crop',
    advertiser_name: 'Coinbase',
    cta_text: 'Start Trading',
    cta_url: '#',
    extracted_features: {
      product: 'Coinbase Exchange',
      category: 'finance',
      brand: 'Coinbase',
      price_range: 'budget',
      attributes: ['crypto', 'exchange', 'bitcoin', 'ethereum', 'trading'],
      target_intent: 'potential buyer',
      keywords: ['coinbase', 'crypto', 'bitcoin', 'ethereum', 'trading', 'exchange', 'blockchain', 'wallet'],
      summary: 'Secure cryptocurrency exchange for buying and selling digital assets',
    },
  },
  {
    title: 'Mint — Smart Budgeting App',
    description: 'Take control of your finances. Mint automatically categorizes your spending, tracks bills, monitors credit score, and helps you save more every month.',
    category: 'finance',
    image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
    advertiser_name: 'Intuit Mint',
    cta_text: 'Get Started Free',
    cta_url: '#',
    extracted_features: {
      product: 'Mint Budgeting App',
      category: 'finance',
      brand: 'Mint',
      price_range: 'budget',
      attributes: ['budgeting', 'expense tracking', 'credit score', 'savings'],
      target_intent: 'browsing',
      keywords: ['mint', 'budget', 'money', 'savings', 'expense', 'finance', 'credit', 'spending', 'bank'],
      summary: 'Free budgeting app for tracking expenses and managing finances',
    },
  },
  {
    title: 'Japan Rail Pass — Explore Japan',
    description: 'Unlimited travel across Japan by bullet train. Visit Tokyo, Kyoto, Osaka, and beyond with a single JR Pass. Available in 7, 14, and 21-day options.',
    category: 'travel',
    image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=250&fit=crop',
    advertiser_name: 'JR Pass',
    cta_text: 'Get Your Pass',
    cta_url: '#',
    extracted_features: {
      product: 'Japan Rail Pass',
      category: 'travel',
      brand: 'JR Pass',
      price_range: 'mid_range',
      attributes: ['train', 'japan', 'bullet train', 'unlimited travel', 'rail pass'],
      target_intent: 'comparison shopper',
      keywords: ['japan', 'rail', 'train', 'tokyo', 'kyoto', 'travel', 'pass', 'bullet train', 'trip'],
      summary: 'Unlimited Japan rail travel pass for tourists',
    },
  },
  {
    title: 'Kayak — Compare Flights Instantly',
    description: 'Search hundreds of travel sites at once. Find the cheapest flights, best hotel deals, and rental cars. Price alerts ensure you never overpay.',
    category: 'travel',
    image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=250&fit=crop',
    advertiser_name: 'Kayak',
    cta_text: 'Search Flights',
    cta_url: '#',
    extracted_features: {
      product: 'Kayak Travel Search',
      category: 'travel',
      brand: 'Kayak',
      price_range: 'budget',
      attributes: ['flight search', 'comparison', 'hotel deals', 'price alerts'],
      target_intent: 'comparison shopper',
      keywords: ['kayak', 'flight', 'hotel', 'compare', 'cheap', 'travel', 'booking', 'deal', 'airline'],
      summary: 'Travel search engine for comparing flights, hotels, and rental cars',
    },
  },
  {
    title: 'Headspace — Meditation Made Simple',
    description: 'Reduce stress, sleep better, and improve focus with guided meditation. Hundreds of sessions for every mood and moment. Start your free trial today.',
    category: 'health',
    image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop',
    advertiser_name: 'Headspace',
    cta_text: 'Try Free',
    cta_url: '#',
    extracted_features: {
      product: 'Headspace Meditation App',
      category: 'health',
      brand: 'Headspace',
      price_range: 'mid_range',
      attributes: ['meditation', 'mindfulness', 'sleep', 'stress relief', 'mental health'],
      target_intent: 'exploring',
      keywords: ['headspace', 'meditation', 'mindfulness', 'sleep', 'stress', 'wellness', 'mental health', 'calm'],
      summary: 'Guided meditation app for stress reduction and better sleep',
    },
  },
  {
    title: 'Whoop 4.0 — Know Your Body',
    description: 'Advanced wearable for tracking strain, recovery, and sleep. Personalized insights powered by machine learning. No screen, no distractions — just data.',
    category: 'health',
    image_url: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=400&h=250&fit=crop',
    advertiser_name: 'Whoop',
    cta_text: 'Join Whoop',
    cta_url: '#',
    extracted_features: {
      product: 'Whoop 4.0 Fitness Tracker',
      category: 'health',
      brand: 'Whoop',
      price_range: 'premium',
      attributes: ['wearable', 'fitness tracker', 'recovery', 'sleep tracking', 'strain'],
      target_intent: 'potential buyer',
      keywords: ['whoop', 'fitness', 'tracker', 'wearable', 'health', 'recovery', 'sleep', 'workout', 'data'],
      summary: 'Advanced fitness wearable for tracking strain, recovery, and sleep',
    },
  },
  {
    title: 'Udemy Business — Upskill Your Team',
    description: 'On-demand learning for organizations. 15,000+ courses in tech, business, and leadership. Customizable learning paths and analytics dashboards.',
    category: 'education',
    image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop',
    advertiser_name: 'Udemy',
    cta_text: 'Request Demo',
    cta_url: '#',
    extracted_features: {
      product: 'Udemy Business',
      category: 'education',
      brand: 'Udemy',
      price_range: 'mid_range',
      attributes: ['corporate training', 'online courses', 'upskilling', 'leadership'],
      target_intent: 'comparison shopper',
      keywords: ['udemy', 'course', 'learn', 'training', 'business', 'skill', 'tutorial', 'education', 'team'],
      summary: 'Corporate learning platform with thousands of professional courses',
    },
  },
  {
    title: 'Shopify — Start Your Store Today',
    description: 'Everything you need to sell online, in-person, and everywhere in between. Beautiful templates, secure payments, and powerful marketing tools.',
    category: 'ecommerce',
    image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop',
    advertiser_name: 'Shopify',
    cta_text: 'Start Free Trial',
    cta_url: '#',
    extracted_features: {
      product: 'Shopify E-commerce Platform',
      category: 'ecommerce',
      brand: 'Shopify',
      price_range: 'mid_range',
      attributes: ['ecommerce', 'online store', 'payments', 'templates', 'marketing'],
      target_intent: 'exploring',
      keywords: ['shopify', 'ecommerce', 'store', 'sell', 'online', 'shop', 'business', 'product', 'payment'],
      summary: 'All-in-one e-commerce platform for building online stores',
    },
  },
  {
    title: 'Amazon Prime — Free 2-Day Shipping',
    description: 'Get free shipping, exclusive deals, Prime Video, and more. Over 200 million items available with next-day delivery. Try Prime free for 30 days.',
    category: 'ecommerce',
    image_url: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400&h=250&fit=crop',
    advertiser_name: 'Amazon',
    cta_text: 'Try Prime Free',
    cta_url: '#',
    extracted_features: {
      product: 'Amazon Prime Membership',
      category: 'ecommerce',
      brand: 'Amazon',
      price_range: 'budget',
      attributes: ['shipping', 'streaming', 'deals', 'membership', 'delivery'],
      target_intent: 'potential buyer',
      keywords: ['amazon', 'prime', 'shop', 'delivery', 'deal', 'discount', 'buy', 'order', 'shipping', 'store'],
      summary: 'Premium membership with free shipping, streaming, and exclusive deals',
    },
  },
];

async function seed(skipConnect = false) {
  if (!skipConnect) {
    await connectDB();
  }

  // Clear existing data
  await Ad.deleteMany({});
  await AdMetric.deleteMany({});
  await Session.deleteMany({});
  await Interaction.deleteMany({});
  await User.deleteMany({});

  console.log('[INFO] Cleared existing data');

  // Create default users
  const adminUser = await User.create({
    email: 'admin@intentmarketer.com',
    password: 'admin123',
    name: 'Admin',
    role: 'admin',
  });
  console.log('[OK] Created admin: admin@intentmarketer.com / admin123');

  const advertiserUser = await User.create({
    email: 'advertiser@demo.com',
    password: 'demo123',
    name: 'Demo Advertiser',
    role: 'advertiser',
    company_name: 'Demo Corp',
  });
  console.log('[OK] Created advertiser: advertiser@demo.com / demo123');

  const publisherUser = await User.create({
    email: 'publisher@demo.com',
    password: 'demo123',
    name: 'Demo Publisher',
    role: 'publisher',
    website_url: 'http://localhost:5174',
    website_name: 'TopicDrill Blog',
    ad_categories: ['tech', 'finance', 'travel', 'health', 'education', 'ecommerce'],
    publisher_id: 'pub_demo_001',
  });
  console.log('[OK] Created publisher: publisher@demo.com / demo123');

  // Insert sample ads
  for (const adData of sampleAds) {
    const ad = new Ad({
      ad_id: uuidv4(),
      ...adData,
      advertiser_id: advertiserUser._id.toString(),
      status: 'active',
    });
    await ad.save();
    console.log(`[OK] Created ad: ${ad.title}`);

    // Create some sample metrics for the last 14 days
    for (let d = 0; d < 14; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);

      const impressions = Math.floor(Math.random() * 200) + 20;
      const clicks = Math.floor(Math.random() * impressions * 0.15);

      await AdMetric.create({
        ad_id: ad.ad_id,
        date,
        impressions,
        clicks,
        ctr: impressions > 0 ? clicks / impressions : 0,
        intent_stages: {
          browsing: Math.floor(clicks * 0.15),
          exploring: Math.floor(clicks * 0.25),
          comparison_shopper: Math.floor(clicks * 0.35),
          potential_buyer: Math.floor(clicks * 0.25),
        },
      });
    }
  }

  // Create sample sessions
  const sampleSessions = [
    { categories: ['tech'], pages: 5, intent: 0.65, stage: 'comparison shopper' },
    { categories: ['finance'], pages: 3, intent: 0.40, stage: 'exploring' },
    { categories: ['travel', 'tech'], pages: 8, intent: 0.80, stage: 'potential buyer' },
    { categories: ['health'], pages: 2, intent: 0.15, stage: 'browsing' },
    { categories: ['education', 'tech'], pages: 6, intent: 0.55, stage: 'comparison shopper' },
  ];

  for (const sessData of sampleSessions) {
    const session = new Session({
      session_id: 'ses_demo_' + uuidv4().substring(0, 8),
      pages_visited: Array.from({ length: sessData.pages }, (_, i) => ({
        url: `https://demo.blog/article-${i + 1}`,
        title: `Sample Article ${i + 1}`,
        category: sessData.categories[i % sessData.categories.length],
        page_type: ['blog', 'comparison', 'product'][i % 3],
        time_spent: Math.floor(Math.random() * 120) + 10,
        scroll_depth: Math.random() * 0.8 + 0.2,
      })),
      total_time_spent: sessData.pages * 45,
      total_clicks: Math.floor(Math.random() * 10),
      avg_scroll_depth: 0.5 + Math.random() * 0.3,
      intent_score: sessData.intent,
      intent_stage: sessData.stage,
      categories_viewed: sessData.categories,
      comparison_count: sessData.stage === 'comparison shopper' ? 2 : 0,
      product_views: sessData.stage === 'potential buyer' ? 3 : 0,
    });
    await session.save();
    console.log(`[OK] Created session: ${session.session_id} (${sessData.stage})`);
  }

  console.log('[OK] Database seeded successfully!');
}

// Export for use as module
module.exports = seed;

// Run directly if called as script
if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
