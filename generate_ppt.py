import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

def create_daily_pricing_focused_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)  # 16:9 Widescreen standard

    # Clean Classic Colors (No boxes, no cards, no grids)
    C_TITLE = RGBColor(15, 23, 42)       # Dark Navy / Slate 900
    C_LINE = RGBColor(37, 99, 235)       # Royal Blue accent line
    C_HEAD = RGBColor(30, 58, 138)      # Blue 900 for bullet headings
    C_BODY = RGBColor(51, 65, 85)       # Slate 700 for readable text
    C_MUTED = RGBColor(100, 116, 139)   # Slate 500 for footer/meta
    C_HIGHLIGHT = RGBColor(185, 28, 28) # Red 700 for price highlights

    blank_layout = prs.slide_layouts[6]

    def add_simple_slide_header(slide, slide_num, title_text):
        # 1. Slide Title
        t_box = slide.shapes.add_textbox(Inches(1.0), Inches(0.5), Inches(11.333), Inches(0.8))
        tf = t_box.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.name = "Calibri"
        p.font.size = Pt(26)
        p.font.bold = True
        p.font.color.rgb = C_TITLE

        # 2. Simple Accent Underline
        line = slide.shapes.add_shape(1, Inches(1.0), Inches(1.35), Inches(11.333), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = C_LINE
        line.line.fill.background()

        # 3. Simple Footer
        f_box = slide.shapes.add_textbox(Inches(1.0), Inches(7.0), Inches(11.333), Inches(0.3))
        ftf = f_box.text_frame
        ftf.word_wrap = True
        ftf.margin_top = ftf.margin_bottom = ftf.margin_left = ftf.margin_right = 0
        pf = ftf.paragraphs[0]
        pf.text = f"SmartBin – Liquidation Bin Store E-Commerce Management System  |  Slide {slide_num} of 10"
        pf.font.name = "Calibri"
        pf.font.size = Pt(10)
        pf.font.color.rgb = C_MUTED

    def set_slide_notes(slide, notes_text):
        notes_slide = slide.notes_slide
        notes_tf = notes_slide.notes_text_frame
        notes_tf.text = notes_text

    # =========================================================================
    # SLIDE 1: Simple Title Slide
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)

    top_line = s1.shapes.add_shape(1, Inches(1.0), Inches(1.0), Inches(11.333), Inches(0.04))
    top_line.fill.solid()
    top_line.fill.fore_color.rgb = C_LINE
    top_line.line.fill.background()

    t_box = s1.shapes.add_textbox(Inches(1.0), Inches(1.3), Inches(11.333), Inches(4.5))
    tf = t_box.text_frame
    tf.word_wrap = True
    tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0

    p = tf.paragraphs[0]
    p.text = "ACADEMIC CAPSTONE PROJECT PRESENTATION"
    p.font.name = "Calibri"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_LINE

    p = tf.add_paragraph()
    p.text = "SMARTBIN"
    p.font.name = "Calibri"
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = C_TITLE

    p = tf.add_paragraph()
    p.text = "Smart Liquidation Bin Store E-Commerce Management System"
    p.font.name = "Calibri"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = C_HEAD

    p = tf.add_paragraph()
    p.text = "Featuring Automated Dynamic Daily Price Drop Architecture, In-Store Bin Mapping, and Reverse Logistics Management."
    p.font.name = "Calibri"
    p.font.size = Pt(14)
    p.font.color.rgb = C_BODY

    p = tf.add_paragraph()
    p.text = "\n• Project Core Innovation: Automated Descending Daily Pricing Engine (Friday to Thursday Price Drops)"
    p.font.name = "Calibri"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_TITLE

    p = tf.add_paragraph()
    p.text = "• Technology Stack: Node.js, Express.js, MySQL 8.0, HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Razorpay"
    p.font.name = "Calibri"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_TITLE

    p = tf.add_paragraph()
    p.text = "• Target Roles: Customers (Online Shoppers), Store Managers (Daily Pricing & Stock), Super Administrators"
    p.font.name = "Calibri"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_TITLE

    set_slide_notes(s1,
        "Good morning respected professors and evaluators. Today, I am presenting our capstone project: "
        "'SmartBin – Smart Liquidation Bin Store E-Commerce Management System'. "
        "The core innovation of our project is the Dynamic Daily Pricing Engine, which automates descending daily price drops "
        "across the week from Friday restock to Thursday clearance. The system is built with Node.js, Express, MySQL, and modern web tools."
    )

    # =========================================================================
    # SLIDE 2: Project Overview & Background
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_simple_slide_header(s2, 2, "Project Overview & Background")

    b_box = s2.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.333), Inches(5.2))
    tf = b_box.text_frame
    tf.word_wrap = True

    bullets_s2 = [
        ("The Liquidation Bin Retail Model:", "Liquidation stores purchase truckloads of customer returns, overstocks, and clearance merchandise from major retailers (Amazon, Walmart, Target) and resell them at deep discounts."),
        ("The Core Concept of Descending Daily Pricing:", "Unlike regular e-commerce with static prices, bin stores sell items on a weekly descending price cycle where every single product drops in price each day until the bins are completely cleared."),
        ("The Weekly Clearance Cycle:", "New inventory arrives every Friday at the highest price. Prices systematically drop every day (Saturday, Sunday, Monday, Tuesday, Wednesday) until Thursday when remaining items are cleared at clearance rates."),
        ("The Reverse Logistics Bottleneck:", "Traditional stores manage these price changes manually with stickers or announcements, causing billing confusion, crowd stampedes, and inventory miscalculations."),
        ("SmartBin's Digital Solution:", "A centralized web platform that automates daily price recalculations in MySQL, displays live daily prices to online customers, maps physical bin locations, and enables 24/7 shopping.")
    ]

    for idx, (head, desc) in enumerate(bullets_s2):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.text = f"•  {head} "
        p.font.name = "Calibri"
        p.font.size = Pt(14.5)
        p.font.bold = True
        p.font.color.rgb = C_HEAD

        run = p.add_run()
        run.text = desc
        run.font.name = "Calibri"
        run.font.size = Pt(13.5)
        run.font.bold = False
        run.font.color.rgb = C_BODY
        p.space_after = Pt(12)

    set_slide_notes(s2,
        "This slide introduces the business model: Liquidation stores clear overstocked pallets using descending daily pricing. "
        "New stock arrives Friday at peak price and drops daily until Thursday clearance. "
        "Traditional stores do this manually with chaotic stickers. SmartBin digitizes and automates this entire daily pricing cycle."
    )

    # =========================================================================
    # SLIDE 3: Objectives & Scope of the Project
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_simple_slide_header(s3, 3, "Project Objectives & Scope")

    b_box = s3.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.333), Inches(5.2))
    tf = b_box.text_frame
    tf.word_wrap = True

    objectives = [
        ("Automate Dynamic Daily Price Drop Schedules:", "Develop an automated pricing engine that checks the current calendar day and updates selling prices across products at midnight without human labor or manual price tagging."),
        ("Support Product-Specific Daily Price Overrides:", "Enable Store Managers to define tailored daily price schedules per product for high-value merchandise (e.g., electronics) using the daily_prices database table."),
        ("Provide Real-Time Inventory & Bin Transparency:", "Display exact physical bin locations (Bin A, Bin B, Bin C) and condition ratings (Brand New, Open Box, Refurbished) so buyers know where items are located and their true condition."),
        ("Secure Multi-Role Governance:", "Provide isolated portals for Customers, Store Managers, and Super Administrators protected by JWT authentication and salted bcrypt password hashing."),
        ("Frictionless E-Commerce & Customer Retention:", "Provide dynamic cart calculation, promotional coupon discounts, Razorpay online payments, and automated Lucky Draw raffle competitions.")
    ]

    for idx, (head, desc) in enumerate(objectives):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.text = f"•  {head} "
        p.font.name = "Calibri"
        p.font.size = Pt(14.5)
        p.font.bold = True
        p.font.color.rgb = C_HEAD

        run = p.add_run()
        run.text = desc
        run.font.name = "Calibri"
        run.font.size = Pt(13.5)
        run.font.bold = False
        run.font.color.rgb = C_BODY
        p.space_after = Pt(12)

    set_slide_notes(s3,
        "Our project objectives focus heavily on automating daily pricing: "
        "1. Dynamic weekly price drops at midnight. "
        "2. Product-specific daily price overrides for managers. "
        "3. Bin location and condition transparency. "
        "4. Multi-role security. "
        "5. Online checkout with Razorpay and lucky draw customer retention."
    )

    # =========================================================================
    # SLIDE 4: Existing System vs. Proposed System
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_simple_slide_header(s4, 4, "Existing System vs. Proposed System")

    b_box = s4.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.333), Inches(5.2))
    tf = b_box.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "Limitations of Existing Traditional Bin Stores:"
    p.font.name = "Calibri"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = RGBColor(190, 18, 60)
    p.space_after = Pt(4)

    ex_points = [
        "Manual Price Re-Labeling: Workers manually re-tag hundreds of items every evening or shout out new daily rates, leading to severe labor overhead and pricing errors.",
        "Zero In-Store Transparency: Shoppers have no way of knowing what products will be priced at on subsequent days, making planning impossible.",
        "Blind In-Person Shopping: Customers must travel physically to stores and rummage through unorganized wooden bins without knowing available stock.",
        "Billing Discrepancies: Cashiers manually enter daily prices at registers, frequently miscalculating totals during crowded morning rushes."
    ]
    for pt in ex_points:
        p = tf.add_paragraph()
        p.text = f"   –  {pt}"
        p.font.name = "Calibri"
        p.font.size = Pt(13)
        p.font.color.rgb = C_BODY
        p.space_after = Pt(3)

    p = tf.add_paragraph()
    p.text = "\nInnovations of Proposed SmartBin Platform:"
    p.font.name = "Calibri"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = RGBColor(21, 128, 61)
    p.space_after = Pt(4)

    prop_points = [
        "Automated Midnight Price Engine: The database scheduler recalculates and applies today's liquidated price automatically at 12:00 AM.",
        "Transparent 7-Day Price Schedule: Customers view the exact price for today and upcoming days of the week on the storefront before purchasing.",
        "24/7 Digital Catalog & Bin Mapping: Customers browse items by physical bin number (Bin A, B), condition grade, and reserve or buy online.",
        "Instant Online Checkout: Razorpay payment gateway automatically applies today's liquidated deal price, generating digital invoices."
    ]
    for pt in prop_points:
        p = tf.add_paragraph()
        p.text = f"   ✔  {pt}"
        p.font.name = "Calibri"
        p.font.size = Pt(13)
        p.font.color.rgb = C_BODY
        p.space_after = Pt(3)

    set_slide_notes(s4,
        "This slide highlights the contrast: "
        "Traditional bin stores suffer from manual price tag replacements, cashier billing errors, and zero inventory visibility. "
        "SmartBin automates the daily price drop at midnight, displays upcoming daily prices transparently to buyers, "
        "and handles checkout securely via Razorpay."
    )

    # =========================================================================
    # SLIDE 5: MAIN FEATURE - DYNAMIC DAILY PRICING SYSTEM & EXACT PRICES
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_simple_slide_header(s5, 5, "Main Feature: Dynamic Daily Pricing Architecture")

    b_box = s5.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.333), Inches(5.2))
    tf = b_box.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "1. Exact Weekly Liquidation Price Drop Schedule (Standard Bins):"
    p.font.name = "Calibri"
    p.font.size = Pt(15.5)
    p.font.bold = True
    p.font.color.rgb = C_HEAD
    p.space_after = Pt(4)

    daily_schedule = [
        ("Friday (Restock Day):", "₹999", "Fresh inventory loaded into bins from retail pallets; highest value day."),
        ("Saturday (Weekend Rush):", "₹799", "High-demand weekend shopping price drop."),
        ("Sunday (Weekend Drop):", "₹599", "Sunday price cut to accelerate weekend volume."),
        ("Monday (Markdown Monday):", "₹399", "Weekday price reduction to drive steady traffic."),
        ("Tuesday (Value Tuesday):", "₹299", "Budget clearance pricing tier."),
        ("Wednesday (Blowout Day):", "₹199", "Deep discount blowout day to clear bins."),
        ("Thursday (Clearance Day):", "₹99", "Final liquidation price before Friday's new inventory restock.")
    ]

    for day_label, price_val, desc in daily_schedule:
        p = tf.add_paragraph()
        p.text = f"   •  {day_label}  "
        p.font.name = "Calibri"
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = C_TITLE

        run_p = p.add_run()
        run_p.text = f"{price_val}  "
        run_p.font.name = "Calibri"
        run_p.font.size = Pt(13.5)
        run_p.font.bold = True
        run_p.font.color.rgb = C_HIGHLIGHT

        run_d = p.add_run()
        run_d.text = f"—  {desc}"
        run_d.font.name = "Calibri"
        run_d.font.size = Pt(12.5)
        run_d.font.bold = False
        run_d.font.color.rgb = C_BODY
        p.space_after = Pt(2)

    p = tf.add_paragraph()
    p.text = "\n2. Product-Specific Daily Price Overrides (daily_prices Table):"
    p.font.name = "Calibri"
    p.font.size = Pt(15.5)
    p.font.bold = True
    p.font.color.rgb = C_HEAD
    p.space_after = Pt(4)

    per_product_points = [
        ("High-Value Product Overrides:", "For electronics or premium products, Store Managers configure custom daily prices per day in daily_prices (e.g., Fri: ₹4,999 ➔ Sat: ₹3,999 ➔ Sun: ₹2,999 ➔ Mon: ₹1,999 ➔ Tue: ₹1,499 ➔ Wed: ₹999 ➔ Thu: ₹499)."),
        ("Automated Daily Application API (/api/daily-prices/apply-today):", "Evaluates current day name (Sunday to Saturday), executes UPDATE products SET price = ? WHERE product_id = ?, and instantly syncs live catalog prices.")
    ]

    for head, desc in per_product_points:
        p = tf.add_paragraph()
        p.text = f"   •  {head} "
        p.font.name = "Calibri"
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = C_TITLE

        run = p.add_run()
        run.text = desc
        run.font.name = "Calibri"
        run.font.size = Pt(12.5)
        run.font.bold = False
        run.font.color.rgb = C_BODY
        p.space_after = Pt(3)

    set_slide_notes(s5,
        "This is the core feature slide of our project: The Dynamic Daily Pricing Engine. "
        "In our system, standard bin products follow a strict weekly descending price schedule: "
        "Friday Restock is ₹999, Saturday is ₹799, Sunday is ₹599, Monday is ₹399, Tuesday is ₹299, Wednesday is ₹199, and Thursday Clearance is ₹99. "
        "Additionally, for premium electronics, Store Managers can set custom daily prices in the daily_prices table. "
        "The system executes the apply-today API to update prices in the products table automatically based on the current day of the week."
    )

    # =========================================================================
    # SLIDE 6: System Architecture & Execution Workflow
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_simple_slide_header(s6, 6, "System Architecture & Execution Workflow")

    b_box = s6.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.333), Inches(5.2))
    tf = b_box.text_frame
    tf.word_wrap = True

    workflow_stages = [
        ("Phase 1: Ingestion & Daily Price Setup", "Store Managers catalog incoming liquidation pallets, assign physical Bin Numbers (Bin A, Bin B), condition grades, and configure the product's daily price schedule from Friday to Thursday."),
        ("Phase 2: Automated Midnight Price Recalculation", "At 12:00 AM, the Express server checks the calendar day against the daily price schedule. Product prices in the database are updated automatically to reflect today's liquidated rate."),
        ("Phase 3: Customer Discovery & Cart Management", "Shoppers browse the storefront showing today's deal price, filter by bin or condition, view upcoming daily price drops, add items to cart, and apply discount promo codes."),
        ("Phase 4: Payment Gateway & Order Synchronization", "Transactions are completed via Razorpay API. In an atomic transaction, the system creates order/payment records, charges today's dynamic price, and decrements stock."),
        ("Phase 5: Fulfillment & Lucky Draw Participation", "Store Managers review orders on the dispatch dashboard and update statuses (Pending ➔ Confirmed ➔ Shipped ➔ Delivered). Customer orders automatically enter weekly Lucky Draws.")
    ]

    for idx, (head, desc) in enumerate(workflow_stages):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.text = f"•  {head}: "
        p.font.name = "Calibri"
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = C_HEAD

        run = p.add_run()
        run.text = desc
        run.font.name = "Calibri"
        run.font.size = Pt(13)
        run.font.bold = False
        run.font.color.rgb = C_BODY
        p.space_after = Pt(12)

    set_slide_notes(s6,
        "Here is the end-to-end system workflow across five phases: "
        "Phase 1: Managers ingest pallets and configure daily price drops. "
        "Phase 2: Automated calculation of today's deal price at midnight. "
        "Phase 3: Customers browse today's deals and add items to cart. "
        "Phase 4: Payment processed via Razorpay at today's active price. "
        "Phase 5: Manager fulfillment and automatic entry into the weekly lucky draw."
    )

    # =========================================================================
    # SLIDE 7: Module Description & Role Responsibilities
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_simple_slide_header(s7, 7, "Module Description & Role Responsibilities")

    b_box = s7.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.333), Inches(5.2))
    tf = b_box.text_frame
    tf.word_wrap = True

    modules = [
        ("Customer Portal (Storefront):", [
            "Today's Deal Display: Prominently view today's active liquidation price banner and 7-day schedule.",
            "Catalog Browsing & Filters: Filter items by Bin Number (Bin A, B, C), Category, Brand, and Condition Grade.",
            "Cart, Wishlist & Vouchers: Subtotal calculation using today's price, stock checks, and coupon discounts.",
            "Order Tracking & Raffles: Self-service order status tracking and Lucky Draw winner boards."
        ]),
        ("Store Manager Portal:", [
            "Daily Price Management: Configure custom Monday–Sunday daily prices for individual products.",
            "Apply Today's Prices: One-click button to trigger /api/daily-prices/apply-today to synchronize product prices.",
            "Product Management & Bins: Add, edit, restock products, and assign physical store bin locations.",
            "Order Fulfillment: Review customer delivery details and update order dispatch stages."
        ]),
        ("Super Administrator Dashboard:", [
            "Platform Analytics: Monitor total revenue, daily orders, active managers, and registered customers.",
            "Global Price Schedule Master: Configure default weekly price drop curves (Friday to Thursday).",
            "Manager Oversight: Onboard, update credentials, and manage privileges of store managers.",
            "Marketing & Raffles: Launch coupon campaigns and trigger automated lucky draw winner selection."
        ])
    ]

    for idx, (m_title, m_items) in enumerate(modules):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.text = f"•  {m_title}"
        p.font.name = "Calibri"
        p.font.size = Pt(14.5)
        p.font.bold = True
        p.font.color.rgb = C_HEAD
        p.space_after = Pt(2)

        for item in m_items:
            p_sub = tf.add_paragraph()
            p_sub.text = f"     –  {item}"
            p_sub.font.name = "Calibri"
            p_sub.font.size = Pt(12.5)
            p_sub.font.color.rgb = C_BODY
            p_sub.space_after = Pt(2)
        
        p_sub.space_after = Pt(8)

    set_slide_notes(s7,
        "SmartBin is partitioned into three distinct modules: "
        "The Customer Portal focuses on displaying today's deal price, bin filters, cart, and order tracking. "
        "The Store Manager Portal manages daily price schedules, triggers price syncs, and handles shipments. "
        "The Super Admin Dashboard oversees weekly price curves, manager accounts, and lucky draws."
    )

    # =========================================================================
    # SLIDE 8: Database Design & Schema Architecture
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_simple_slide_header(s8, 8, "Database Design & Daily Pricing Schema")

    b_box = s8.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.333), Inches(5.2))
    tf = b_box.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "13 Normalized Relational Tables in MySQL (liquidation_bin):"
    p.font.name = "Calibri"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = C_HEAD
    p.space_after = Pt(6)

    db_text = [
        ("daily_prices Entity (Core Feature Table):", "Stores price_id (PK), product_id (FK), day_name (ENUM: 'Monday'...'Sunday'), price (DECIMAL 10,2), and updated_at timestamp. Enables per-product daily price overrides."),
        ("products Entity:", "Stores product_id (PK), manager_id (FK), product_name, category, brand, price (current liquidated price), quantity, image, and bin_number."),
        ("Authentication & Roles Entities:", "admins, managers, and users tables store user credentials with 60-character bcrypt salted password hashing and unique email indexes."),
        ("Commerce & Transactional Entities:", "cart, cart_items, wishlist, orders, order_items, and payments tables maintain complete transactional integrity with cascading foreign keys."),
        ("Marketing & Gamification Entities:", "offers, promotional_offers, lucky_draws, and winners tables manage coupon codes, raffle contests, and winner history."),
        ("Database Normalization & Integrity:", "Structured in Third Normal Form (3NF) with foreign key constraints (ON DELETE CASCADE / SET NULL) to ensure zero data redundancy and ACID reliability.")
    ]

    for head, desc in db_text:
        p = tf.add_paragraph()
        p.text = f"•  {head} "
        p.font.name = "Calibri"
        p.font.size = Pt(13.5)
        p.font.bold = True
        p.font.color.rgb = C_TITLE

        run = p.add_run()
        run.text = desc
        run.font.name = "Calibri"
        run.font.size = Pt(13)
        run.font.bold = False
        run.font.color.rgb = C_BODY
        p.space_after = Pt(8)

    set_slide_notes(s8,
        "Our database is built in MySQL in Third Normal Form across 13 tables: "
        "The daily_prices table is the core entity that links product_id with each day_name and liquidated price. "
        "The products table maintains the current active price and bin location. "
        "Transactional tables maintain orders and payments, while gamification tables manage coupons and lucky draws."
    )

    # =========================================================================
    # SLIDE 9: Technology Stack Used
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_simple_slide_header(s9, 9, "Technology Stack & Development Tools")

    b_box = s9.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.333), Inches(5.2))
    tf = b_box.text_frame
    tf.word_wrap = True

    tech_bullets = [
        ("Frontend Layer:", "HTML5 for semantic layouts, CSS3 for custom responsive styling, Bootstrap 5 for grid systems and modal interfaces, Vanilla JavaScript (ES6+) for dynamic DOM rendering and Fetch API, and FontAwesome 6 icons."),
        ("Backend & API Layer:", "Node.js as the non-blocking asynchronous event loop runtime; Express.js as the RESTful API framework; Express Router for modular daily-price and product routes; Multer for product photo uploads; CORS and Body-Parser."),
        ("Database & Security:", "MySQL 8.0 ACID-compliant relational database engine; mysql2/promise driver supporting connection pooling; JSON Web Tokens (JWT) for stateless authentication; bcrypt.js for 10-round password hashing; Dotenv for environment protection."),
        ("Payment Gateway & Tools:", "Razorpay Payment Gateway API for secure online card/UPI checkout; Postman for REST endpoint testing; Visual Studio Code as the primary IDE; Git and GitHub for version control; and Nodemon for hot-reloading development.")
    ]

    for idx, (head, desc) in enumerate(tech_bullets):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.text = f"•  {head} "
        p.font.name = "Calibri"
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = C_HEAD

        run = p.add_run()
        run.text = desc
        run.font.name = "Calibri"
        run.font.size = Pt(13)
        run.font.bold = False
        run.font.color.rgb = C_BODY
        p.space_after = Pt(12)

    set_slide_notes(s9,
        "Our technology stack spans four core layers: "
        "Frontend: HTML5, CSS3, Bootstrap 5, and modern Vanilla JavaScript for fast rendering. "
        "Backend: Node.js and Express.js providing modular REST APIs and daily price controllers. "
        "Database: MySQL 8 with connection pooling, protected by bcrypt and JWT authentication. "
        "Tools & APIs: Razorpay for payments, Postman for testing, and Git for version control."
    )

    # =========================================================================
    # SLIDE 10: Future Enhancements & Conclusion
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_simple_slide_header(s10, 10, "Future Enhancements & Project Conclusion")

    b_box = s10.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.333), Inches(5.2))
    tf = b_box.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "Future Enhancements & Scalability Roadmap:"
    p.font.name = "Calibri"
    p.font.size = Pt(15.5)
    p.font.bold = True
    p.font.color.rgb = C_HEAD
    p.space_after = Pt(4)

    future_pts = [
        "Automated Midnight Cron Jobs: Configure node-cron to execute /api/daily-prices/apply-today at precisely 12:00 AM daily without requiring manager triggers.",
        "AI Dynamic Pricing Optimization: Deploy machine learning models to analyze remaining stock velocity and automatically recommend optimal daily price drop rates.",
        "Cross-Platform Mobile App: Build Flutter / React Native apps with automated push notifications notifying users at midnight of new daily price drops.",
        "In-Store Omnichannel QR Code Scanners: Place QR tags on physical bins so in-store walk-in customers can scan items to check upcoming price drop schedules."
    ]
    for pt in future_pts:
        p = tf.add_paragraph()
        p.text = f"   •  {pt}"
        p.font.name = "Calibri"
        p.font.size = Pt(12.5)
        p.font.color.rgb = C_BODY
        p.space_after = Pt(3)

    p = tf.add_paragraph()
    p.text = "\nProject Conclusion & Takeaways:"
    p.font.name = "Calibri"
    p.font.size = Pt(15.5)
    p.font.bold = True
    p.font.color.rgb = C_HEAD
    p.space_after = Pt(4)

    conclusion_pts = [
        "Successfully digitized reverse logistics liquidation retail with an automated dynamic daily pricing engine.",
        "Demonstrated full-stack engineering with a responsive frontend, RESTful Node.js backend, and a 13-table 3NF MySQL database.",
        "Delivered real business impact: descending daily price drops, physical bin mapping, online payments, and gamification."
    ]
    for pt in conclusion_pts:
        p = tf.add_paragraph()
        p.text = f"   ✔  {pt}"
        p.font.name = "Calibri"
        p.font.size = Pt(12.5)
        p.font.color.rgb = C_BODY
        p.space_after = Pt(3)

    p_end = tf.add_paragraph()
    p_end.text = "\nThank You!  —  Questions & Answers Session Open for Discussion"
    p_end.font.name = "Calibri"
    p_end.font.size = Pt(14)
    p_end.font.bold = True
    p_end.font.color.rgb = C_LINE

    set_slide_notes(s10,
        "In conclusion, SmartBin demonstrates how modern software engineering can solve real-world reverse logistics challenges "
        "by automating the exciting descending daily pricing model. "
        "We have developed a complete full-stack platform with daily pricing, bin mapping, secure payments, and lucky draws. "
        "Thank you for your time. We are now ready for your questions and project demonstration."
    )

    output_path = r"c:\Users\FIDHA\Desktop\liqudation-bin\SmartBin_Project_Presentation.pptx"
    prs.save(output_path)
    print(f"Daily-pricing focused presentation generated successfully: {output_path}")

if __name__ == "__main__":
    create_daily_pricing_focused_presentation()
