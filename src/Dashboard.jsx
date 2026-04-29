// FreeWheel global industry taxonomy — parsed from official PDF (43 pages, 1,094 industries)
// Format: [id, name, depth]   (depth 0 = parent, 1 = child, 2 = grandchild)
const FW_INDUSTRIES = [[92,"Abrasives Manufacture",0],[57,"Accounting Services",0],[382,"Adult Entertainment and Paraphernalia",0],[4951,"Adult Entertainment and Paraphernalia > Adults only or Sexual Content",1],[4952,"Adult Entertainment and Paraphernalia > Adult Entertainment and Paraphernalia - All else",1],[241,"Advertising and Marketing",0],[4953,"Advertising and Marketing > Marketing Agency",1],[9295,"Advertising and Marketing > Online Advertising Services",1],[4954,"Advertising and Marketing > Advertising and Marketing - All else",1],[93,"Aerospace Products and Parts Manufacture",0],[1,"Agriculture Crop Production",0],[4955,"Agriculture Crop Production > Agriculture equipment",1],[4956,"Agriculture Crop Production > Farm Fertilizers",1],[4957,"Agriculture Crop Production > Agriculture Crop Production - All else",1],[2,"Agriculture Livestock Production",0],[4958,"Agriculture Livestock Production > Animal nutrition",1],[4959,"Agriculture Livestock Production > Agriculture Livestock Production - All else",1],[242,"Air Charter Services",0],[94,"Aircraft Parts Manufacture",0],[319,"Airlines",0],[4960,"Airlines > Domestic Airlines",1],[4961,"Airlines > International Airlines",1],[4962,"Airlines > Airlines - All else",1],[4963,"Alcoholic beverages",0],[9138,"Alcoholic beverages > Alcopop",1],[4964,"Alcoholic beverages > Beer/Cider/Lager Beverages",1],[9140,"Alcoholic beverages > Liqueur",1],[4966,"Alcoholic beverages > Spirits Beverages",1],[4965,"Alcoholic beverages > Wine Beverages",1],[4967,"Alcoholic beverages > Alcoholic beverages - All else",1],[161,"Amusement Parks & Arcades",0],[4968,"Amusement Parks & Arcades > Leisure Park",1],[9189,"Amusement Parks & Arcades > Theme Park",1],[4969,"Amusement Parks & Arcades > Amusement Parks & Arcades - All else",1],[95,"Apparel Manufacture",0],[4970,"Apparel Manufacture > Bag/Wallet Manufacturer",1],[4971,"Apparel Manufacture > Sunglasses Manufacturer",1],[4972,"Apparel Manufacture > Watch/Jewelry Manufacturer",1],[4973,"Apparel Manufacture > Apparel Manufacture - All else",1],[30,"Architects Offices",0],[380,"Armed Forces",0],[193,"Automobile Dealers - Luxury",0],[194,"Automobile Dealerships",0],[96,"Automobile Manufacture",0],[4976,"Automobile Manufacture > Auto Warranties",1],[4975,"Automobile Manufacture > Bike/Scooter",1],[9314,"Automobile Manufacture > Budget Cars",1],[4974,"Automobile Manufacture > Car/Van",1],[9317,"Automobile Manufacture > City Cars",1],[9315,"Automobile Manufacture > Crossover",1],[9316,"Automobile Manufacture > Luxury Cars",1],[9318,"Automobile Manufacture > Micro Cars",1],[4977,"Automobile Manufacture > Automobile Manufacture - All else",1],[195,"Automobile Parts Wholesale-Retail",0],[4982,"Automobile Parts Wholesale-Retail > Motor Accessory Retailer",1],[4981,"Automobile Parts Wholesale-Retail > Petrol/Oil/Lubricant Retailer",1],[4983,"Automobile Parts Wholesale-Retail > Automobile Parts Wholesale-Retail - All else",1],[97,"Automobile Parts and Accessories Manufacture",0],[4979,"Automobile Parts and Accessories Manufacture > Motor Accessory Manufacture",1],[4978,"Automobile Parts and Accessories Manufacture > Petrol/Oil/Lubricant Manufacture",1],[4980,"Automobile Parts and Accessories Manufacture > Automobile Parts and Accessories Manufacture - All else",1],[244,"Automobile Rental and Leasing",0],[4984,"Automobile Rental and Leasing > Commercial Car Rental",1],[4985,"Automobile Rental and Leasing > Automobile Rental and Leasing - All else",1],[245,"Automotive Repair Shops",0],[9143,"Automotive Roadside Assistance",0],[246,"Aviation Services",0],[9174,"Baby and Toddler Products",0],[9183,"Baby and Toddler Products > Baby Bath Products",1],[9179,"Baby and Toddler Products > Baby Bouncers and Rockers",1],[9180,"Baby and Toddler Products > Baby Carriers",1],[9175,"Baby and Toddler Products > Baby Gift Sets",1],[9177,"Baby and Toddler Products > Baby Safety Products",1],[9176,"Baby and Toddler Products > Diapers",1],[9181,"Baby and Toddler Products > High Chairs and Boosters",1],[9178,"Baby and Toddler Products > Nursing and Feeding Products",1],[9182,"Baby and Toddler Products > Strollers and Joggers",1],[9368,"Baby and Toddler Products > Toilet Training Products",1],[9367,"Baby and Toddler Products > Baby and Toddler Products - All else",1],[3,"Bakeries",0],[58,"Banks and Credit Unions",0],[197,"Bars and Nightclubs",0],[98,"Battery Manufacture",0],[4986,"Battery Manufacture > Household Batteries",1],[4987,"Battery Manufacture > Battery Manufacture - All else",1],[9329,"Beauty Salon",0],[162,"Bed and Breakfast Inns",0],[4,"Beef Cattle Ranching",0],[198,"Beer, Wine, and Liquor Stores",0],[4988,"Beer, Wine, and Liquor Stores > Beer/Cider/Lager Store",1],[4990,"Beer, Wine, and Liquor Stores > Spirits Store",1],[4989,"Beer, Wine, and Liquor Stores > Wine Store",1],[4991,"Beer, Wine, and Liquor Stores > Beer, Wine, and Liquor Stores - All else",1],[6,"Beverage Manufacture and Bottling",0],[324,"Biofuels Production",0],[7,"Biotechnology Sector",0],[384,"Birth Control Products",0],[4992,"Birth Control Products > Condom Product",1],[4993,"Birth Control Products > Pregnancy Kit Product",1],[4994,"Birth Control Products > Birth Control Products - All else",1],[100,"Boat Building",0],[163,"Boat Dealers",0],[9588,"Body Art",0],[9590,"Body Art > Piercings",1],[9589,"Body Art > Tattoo",1],[290,"Book Publishers",0],[200,"Bookstores",0],[164,"Bowling Centers",0],[8,"Breweries",0],[4995,"Beer/Cider/Lager",0],[4997,"Spirits",0],[4996,"Wine",0],[4998,"Breweries - All else",0],[31,"Building Material Supply",0],[9603,"Cannabidiol (CBD)",0],[248,"Car Washes",0],[9268,"Carpeting and Flooring Services",0],[249,"Catering Services",0],[32,"Cement, Concrete and Construction Material",0],[9,"Chemical Manufacturing - Agricultural",0],[104,"Chemical Manufacturing - Industrial",0],[105,"Chemicals",0],[352,"Chemicals Distributors",0],[165,"Child-care Facilities",0],[74,"Chiropractor Offices",0],[166,"Churches & Religious Groups",0],[202,"Clothing Stores",0],[5002,"Clothing Stores > Children's clothing",1],[9185,"Clothing Stores > Clothing General",1],[9276,"Clothing Stores > Hosiery",1],[5004,"Clothing Stores > Lingerie",1],[4999,"Clothing Stores > Men's and Women's clothing",1],[5000,"Clothing Stores > Men's clothing",1],[5003,"Clothing Stores > Shoes",1],[5006,"Clothing Stores > Sportswear/fitness",1],[5005,"Clothing Stores > Swimwear",1],[5001,"Clothing Stores > Women's clothing",1],[5007,"Clothing Stores > Clothing Stores - All else",1],[325,"Coal Mining",0],[203,"Coffee Shops",0],[10,"Coffee and Tea Manufacture",0],[167,"Colleges and Universities",0],[33,"Commercial Construction Contractors",0],[5008,"Commercial Construction Contractors > Industrial Builder/Housing",1],[5009,"Commercial Construction Contractors > Commercial Construction Contractors - All else",1],[11,"Commercial Fishing and Seafood Distribution",0],[107,"Commercial Printing",0],[251,"Commercial and Industrial Equipment Rental",0],[168,"Community Colleges",0],[108,"Computer Manufacture",0],[5018,"Computer Manufacture > Home/Office Computer",1],[9282,"Computer Manufacture > Home/Office Networking",1],[5019,"Computer Manufacture > Home/Office Printer",1],[5020,"Computer Manufacture > Home/Office Tablet",1],[5021,"Computer Manufacture > Computer Manufacture - All else",1],[293,"Computer Software Development",0],[291,"Computer and Office Equipment Distributors",0],[5012,"Computer and Office Equipment Distributors > computers distributor",1],[5010,"Computer and Office Equipment Distributors > copiers distributor",1],[5013,"Computer and Office Equipment Distributors > faxesdistributor",1],[5011,"Computer and Office Equipment Distributors > printers distributor",1],[5014,"Computer and Office Equipment Distributors > Computer and Office Equipment Distributors - All else",1],[204,"Computer and Software Stores",0],[5015,"Computer and Software Stores > Computer Game Store",1],[5016,"Computer and Software Stores > Computer Software",1],[5017,"Computer and Software Stores > Computer and Software Stores - All else",1],[34,"Concrete and Masonry Contractors",0],[35,"Construction Machinery Manufacturing",0],[59,"Consulting Services",0],[205,"Consumer Electronics Stores",0],[60,"Consumer Finance",0],[5028,"Consumer Finance > Credit Card",1],[5029,"Consumer Finance > Credit Check",1],[5030,"Consumer Finance > Endowment",1],[5031,"Consumer Finance > Life/Assurance",1],[5022,"Consumer Finance > Loan",1],[5023,"Consumer Finance > Loan > Car Loan",2],[5024,"Consumer Finance > Loan > Debt consolidation loan",2],[5025,"Consumer Finance > Loan > Equity Release Loan",2],[5026,"Consumer Finance > Loan > Personal/other Loan",2],[5027,"Consumer Finance > Loan > Loan - all else",2],[5032,"Money Transfer",0],[5033,"Mortgage",0],[5034,"Pension/Investment",0],[5035,"Share Trading",0],[5036,"Travelers Check",0],[5037,"Consumer Finance - All else",0],[374,"Consumer Product Rental",0],[206,"Convenience Stores and Gas Stations",0],[207,"Cosmetics, Beauty Supply, and Perfume Stores",0],[5043,"Cosmetics, Beauty Supply, and Perfume Stores > Cleansers",1],[9280,"Cosmetics, Beauty Supply, and Perfume Stores > Eye Cream",1],[5044,"Cosmetics, Beauty Supply, and Perfume Stores > Facial beauty product",1],[5062,"Cosmetics, Beauty Supply, and Perfume Stores > Foot care product",1],[5053,"Cosmetics, Beauty Supply, and Perfume Stores > Haircare products",1],[5054,"Cosmetics, Beauty Supply, and Perfume Stores > Haircare products > Hair color",2],[5056,"Cosmetics, Beauty Supply, and Perfume Stores > Haircare products > Hair lice product",2],[5055,"Cosmetics, Beauty Supply, and Perfume Stores > Haircare products > Hair loss product",2],[5057,"Cosmetics, Beauty Supply, and Perfume Stores > Haircare products > Hair removal product",2],[5058,"Cosmetics, Beauty Supply, and Perfume Stores > Haircare products > Shampoo/Conditioner",2],[5059,"Cosmetics, Beauty Supply, and Perfume Stores > Haircare products > Spray/gel/Mousse",2],[5060,"Cosmetics, Beauty Supply, and Perfume Stores > Haircare products > Haircare products - All else",2],[5045,"Cosmetics, Beauty Supply, and Perfume Stores > Hand care product",1],[5061,"Cosmetics, Beauty Supply, and Perfume Stores > Lipcare product",1],[5046,"Cosmetics, Beauty Supply, and Perfume Stores > Makeup",1],[5051,"Cosmetics, Beauty Supply, and Perfume Stores > Makeup > Blush/Bronzer",2],[9279,"Cosmetics, Beauty Supply, and Perfume Stores > Makeup > Cosmetics - Nail",2],[5047,"Cosmetics, Beauty Supply, and Perfume Stores > Makeup > Eyeliner",2],[5048,"Cosmetics, Beauty Supply, and Perfume Stores > Makeup > Foundation",2],[5049,"Cosmetics, Beauty Supply, and Perfume Stores > Makeup > Lipstick",2],[5050,"Cosmetics, Beauty Supply, and Perfume Stores > Makeup > Mascara",2],[5052,"Cosmetics, Beauty Supply, and Perfume Stores > Makeup > Makeup - All else",2],[5038,"Cosmetics, Beauty Supply, and Perfume Stores > Perfume",1],[5041,"Cosmetics, Beauty Supply, and Perfume Stores > Perfume > Children's perfume",2],[9320,"Cosmetics, Beauty Supply, and Perfume Stores > Perfume > Men's Perfume - Luxury",2],[5039,"Cosmetics, Beauty Supply, and Perfume Stores > Perfume > Men's perfume",2],[9321,"Cosmetics, Beauty Supply, and Perfume Stores > Perfume > Unisex Perfume",2],[9322,"Cosmetics, Beauty Supply, and Perfume Stores > Perfume > Unisex Perfume - Luxury",2],[9319,"Cosmetics, Beauty Supply, and Perfume Stores > Perfume > Women's Perfume - Luxury",2],[5040,"Cosmetics, Beauty Supply, and Perfume Stores > Perfume > Women's perfume",2],[5042,"Cosmetics, Beauty Supply, and Perfume Stores > Perfume > Perfume - All else",2],[5063,"Cosmetics, Beauty Supply, and Perfume Stores > Skin lotion/sun screen/self-tanner",1],[5064,"Cosmetics, Beauty Supply, and Perfume Stores > Cosmetics, Beauty Supply, and Perfume Stores - All else",1],[61,"Credit Card Processing",0],[62,"Credit Collections and Services",0],[5065,"Cruises",0],[9172,"Currency & Digital Currency",0],[5072,"DIY",0],[5073,"DIY > DIY Materials",1],[9222,"DIY > DIY Store",1],[5074,"DIY > DIY Tools",1],[5075,"DIY > DIY - All else",1],[12,"Dairy Products Manufacture",0],[5066,"Dairy Products Manufacture > Butter/Margarine/Spread",1],[5067,"Dairy Products Manufacture > Cheese/Eggs",1],[5068,"Dairy Products Manufacture > Milk/Milk Substitute",1],[9305,"Dairy Products Manufacture > Milk/Milk Substitute > Non-Dairy Milk Substitute",2],[5069,"Dairy Products Manufacture > Yogurt",1],[9242,"Dairy Products Manufacture > Yogurt Drinks, Flavored, and Low Fat",1],[5070,"Dairy Products Manufacture > Dairy Products Manufacture - All else",1],[327,"Deep Sea Shipping",0],[75,"Dentists Offices & Clinics",0],[208,"Department Stores & Discount Stores",0],[9325,"Department Stores & Discount Stores > Department Stores",1],[9327,"Department Stores & Discount Stores > Discount and Warehouse Sales",1],[5071,"Department Stores & Discount Stores > Luggage",1],[9357,"Department Stores & Discount Stores > Department Stores & Discount Stores - All else",1],[9697,"Digital Goods",0],[255,"Direct Marketing Services",0],[76,"Drugstores",0],[5077,"Drugstores > Energy/Stimulant Products",1],[5076,"Drugstores > Pharmacy/Chemist",1],[5078,"Drugstores > Drugstores - All else",1],[256,"Dry Cleaning and Laundry Facilities",0],[36,"Drywall, Plaster, Acoustic & Insulation Contractors",0],[169,"Education and Training Services",0],[5080,"Education and Training Services > Driving Lessons",1],[5079,"Education and Training Services > Education Courses",1],[9271,"Education and Training Services > Exchange Programs",1],[9269,"Education and Training Services > Language Learning",1],[9270,"Education and Training Services > Professional Schools",1],[9272,"Education and Training Services > Tutoring Services",1],[5081,"Education and Training Services > Education and Training Services - All else",1],[170,"Electric Energy Distribution",0],[329,"Electric Power Generation",0],[37,"Electrical Contractors",0],[356,"Electrical, Plumbing, and Hardware Distributors",0],[111,"Electronic Components & Semiconductor Manufacture",0],[357,"Electronic Components & Semiconductor Wholesalers",0],[112,"Electronic Gaming Products",0],[38,"Engineering Services",0],[296,"Entertainment and Games Software",0],[5089,"Entertainment and Games Software > Game Genre",1],[5090,"Entertainment and Games Software > Game Genre > Family Entertainment",2],[5091,"Entertainment and Games Software > Game Genre > Fighting/Shooting",2],[5092,"Entertainment and Games Software > Game Genre > Motorsport",2],[5093,"Entertainment and Games Software > Game Genre > Role Play/Fantasy",2],[5094,"Entertainment and Games Software > Game Genre > Sports",2],[5095,"Entertainment and Games Software > Game Genre > Game genre - All else",2],[9308,"Entertainment and Games Software > Games by Platform",1],[9309,"Entertainment and Games Software > Games by Platform > Computer Games",2],[9310,"Entertainment and Games Software > Games by Platform > Console Games",2],[9311,"Entertainment and Games Software > Games by Platform > Handheld Console Games",2],[9307,"Entertainment and Games Software > Games by Platform > Mobile Games",2],[9312,"Entertainment and Games Software > Games by Platform > Virtual Reality Games",2],[9313,"Entertainment and Games Software > Games by Platform > Games by Platform - All else",2],[5082,"Entertainment and Games Software > Video Game Ratings",1],[5087,"Entertainment and Games Software > Video Game Ratings > Rating: A 18+",2],[5083,"Entertainment and Games Software > Video Game Ratings > Rating: E",2],[5084,"Entertainment and Games Software > Video Game Ratings > Rating: E 10+",2],[5086,"Entertainment and Games Software > Video Game Ratings > Rating: M",2],[5085,"Entertainment and Games Software > Video Game Ratings > Rating: T",2],[5088,"Entertainment and Games Software > Video Game Ratings > Video Game Ratings - All else",2],[5096,"Entertainment and Games Software > Entertainment and Games Software - All else",1],[385,"Entertainment and Performance Arts",0],[5097,"Entertainment and Performance Arts > Event",1],[5098,"Entertainment and Performance Arts > Event > Concert event",2],[5099,"Entertainment and Performance Arts > Event > Exhibition",2],[5100,"Entertainment and Performance Arts > Event > Sporting event",2],[5101,"Entertainment and Performance Arts > Event > Theater",2],[5102,"Entertainment and Performance Arts > Event > Ticket Agent",2],[5103,"Entertainment and Performance Arts > Event > Trade Shows/Fairs",2],[5104,"Entertainment and Performance Arts > Event > Event - All else",2],[5105,"Entertainment and Performance Arts > Psychics/Fortune Telling",1],[5106,"Entertainment and Performance Arts > Quiz",1],[5107,"Entertainment and Performance Arts > Entertainment and Performance Arts - All else",1],[5108,"Environment",0],[39,"Erosion Control",0],[113,"Fabricated Metal Parts Manufacturing",0],[14,"Farm Equipment Manufacture and Distribution",0],[5109,"Fashion accessories",0],[5110,"Fashion accessories > Eye glasses",1],[5115,"Fashion accessories > Jewelry",1],[5116,"Fashion accessories > Leather goods",1],[5113,"Fashion accessories > Purse/bag",1],[5111,"Fashion accessories > Sunglasses",1],[5114,"Fashion accessories > Wallet",1],[5112,"Fashion accessories > Watches",1],[5117,"Fashion accessories > Fashion accessories - All else",1],[15,"Fast Food and Quickservice Restaurants",0],[259,"Fast Lube / Auto Oil Change Service",0],[383,"Feminine Hygiene Products",0],[63,"Financial Planners and Investment Advisors",0],[5118,"Financial Planners and Investment Advisors > Financial Consultant",1],[5119,"Financial Planners and Investment Advisors > Financial Planners and Investment Advisors - All else",1],[386,"Financial Services",0],[9810,"Fireworks",0],[171,"Fitness Centers",0],[115,"Fitness Equipment",0],[116,"Floor Coverings",0],[212,"Florists",0],[387,"Food - Candy",0],[9235,"Food - Candy > Chocolate Spread",1],[9236,"Food - Candy > Nougat",1],[5121,"Food - Candy > chewing gum",1],[5122,"Food - Candy > chocolate",1],[5120,"Food - Candy > confectionery",1],[5123,"Food - Candy > Food -Candy - All else",1],[5152,"Food - Cooking Oils",0],[5156,"Food - Cooking Oils > Coconut Oil",1],[5154,"Food - Cooking Oils > Margarines",1],[5153,"Food - Cooking Oils > Olive Oil",1],[5155,"Food - Cooking Oils > Vegetable oil",1],[5157,"Food - Cooking Oils > Food - Cooking Oils - All else",1],[5124,"Food - Dessert",0],[5126,"Food - Dessert > Cake",1],[9237,"Food - Dessert > Compotes",1],[5128,"Food - Dessert > Cookie",1],[9238,"Food - Dessert > Entremets",1],[5130,"Food - Dessert > Ice Cream",1],[5125,"Food - Dessert > Pastry",1],[5127,"Food - Dessert > Pie",1],[5129,"Food - Dessert > Ready-to-eat desserts",1],[5131,"Food - Dessert > Food - Dessert - All else",1],[388,"Food - Packaged",0],[5138,"Food - Packaged > Baby Food",1],[5136,"Food - Packaged > Butter/Margarine",1],[5132,"Food - Packaged > Cereals",1],[5135,"Food - Packaged > Chips",1],[5133,"Food - Packaged > Condiments",1],[9227,"Food - Packaged > Condiments > Appetizers and Dips",2],[9225,"Food - Packaged > Condiments > Ketchup",2],[9226,"Food - Packaged > Condiments > Mayonnaise, Cold Sauces",2],[9231,"Food - Packaged > Condiments > Mustard",2],[9229,"Food - Packaged > Condiments > Pickles, Relish, Olives",2],[9228,"Food - Packaged > Condiments > Salad Dressing",2],[9233,"Food - Packaged > Condiments > Vinegar",2],[5142,"Food - Packaged > Frozen Foods",1],[5143,"Food - Packaged > Health and Dietary Foods",1],[9230,"Food - Packaged > Herbs and Spices",1],[5140,"Food - Packaged > Jam/preserves/honey",1],[5134,"Food - Packaged > Pasta, rice, bread",1],[9137,"Food - Packaged > Bread",1],[9343,"Food - Packaged > Pasta",1],[9344,"Food - Packaged > Rice",1],[5141,"Food - Packaged > Pre-made dinners",1],[9240,"Food - Packaged > Meat and Poultry Meals",1],[9241,"Food - Packaged > Prepared Salads",1],[9239,"Food - Packaged > Vegetarian Meals",1],[9232,"Food - Packaged > Salts",1],[5139,"Food - Packaged > Sauces/Stocks/Powders",1],[9299,"Food - Packaged > Snack Bars, Granola Bars",1],[9139,"Food - Packaged > Snacks",1],[5137,"Food - Packaged > Soups",1],[9145,"Food - Packaged > Sugars and Sweeteners",1],[5144,"Food - Packaged > Food - Packaged - All else",1],[5145,"Food - Vegetables, Meat, Fish",0],[5149,"Food - Vegetables, Meat, Fish > Beef",1],[5147,"Food - Vegetables, Meat, Fish > Dried Fruits and Vegetables",1],[5148,"Food - Vegetables, Meat, Fish > Fish",1],[5146,"Food - Vegetables, Meat, Fish > Fresh Fruits and Vegetables",1],[9304,"Food - Vegetables, Meat, Fish > > Fresh Fruits and Vegetables > Fresh Fruit",2],[9186,"Food - Vegetables, Meat, Fish > > Fresh Fruits and Vegetables > Fresh Vegetables",2],[9303,"Food - Vegetables, Meat, Fish > Oysters and Shellfish",1],[5150,"Food - Vegetables, Meat, Fish > Poultry",1],[5151,"Food - Vegetables, Meat, Fish > Food - Vegetables, Meat, Fish - All else",1],[16,"Food Distributors",0],[17,"Food Service Contractors",0],[117,"Footwear Manufacture, Wholesale, and Retail",0],[9335,"Footwear Manufacture, Wholesale, and Retail > Boots",1],[9336,"Footwear Manufacture, Wholesale, and Retail > Dress Shoes",1],[9215,"Footwear Manufacture, Wholesale, and Retail > Sport Footwear",1],[9214,"Footwear Manufacture, Wholesale, and Retail > Footwear Manufacture, Wholesale, and Retail - All else",1],[40,"Framing Contractors",0],[5158,"Franchises and Business Opportunities",0],[263,"Freight Shipping Services",0],[18,"Fruit and Vegetable Processing",0],[214,"Fuel Oil and LP Gas Dealers",0],[264,"Funeral Operations",0],[119,"Furniture Manufacturing",0],[215,"Furniture Stores",0],[5159,"Futures and Commodities",0],[173,"Gambling Operations",0],[5168,"Gambling Operations > Bingo Hall",1],[5169,"Gambling Operations > Lottery",1],[5171,"Gambling Operations > Online Gambling",1],[5167,"Gambling Operations > Poker/Casino",1],[5170,"Gambling Operations > Reward Schemes",1],[5172,"Gambling Operations > Gambling Operations - All else",1],[5160,"Gardening",0],[5165,"Gardening > Fertilizers and garden treatments",1],[5162,"Gardening > Gardening tools",1],[5163,"Gardening > Gardening tools - electrical",1],[9216,"Gardening > Lawnmower",1],[5164,"Gardening > Plant containers, mini-greenhouses",1],[5161,"Gardening > Plants and seeds",1],[9217,"Gardening > Strimmer",1],[5166,"Gardening > Gardening - All else",1],[9359,"Gift and Holiday Products",0],[9360,"Gift and Holiday Products > Gift Baskets",1],[9361,"Gift and Holiday Products > Gift Cards and Coupons",1],[9362,"Gift and Holiday Products > Gift Certificates",1],[9333,"Gift and Holiday Products > Gift Services",1],[9363,"Gift and Holiday Products > Greeting Cards",1],[9364,"Gift and Holiday Products > Holiday and Ethnic Items",1],[9365,"Gift and Holiday Products > Party Goods",1],[216,"Gift and Souvenir Stores",0],[120,"Glass and Fiber Optic Manufacturing",0],[174,"Golf Courses",0],[41,"Government Contractors",0],[298,"Graphic Design Services",0],[19,"Grocery Stores and Supermarkets",0],[9355,"Grocery Stores and Supermarkets > Grocery Stores",1],[9323,"Grocery Stores and Supermarkets > Supermarkets",1],[121,"Gun Manufacturing",0],[5173,"Gun Manufacturing > Firearms",1],[5174,"Gun Manufacturing > Gun Manufacturing - All else",1],[43,"HVAC and Plumbing Contractors",0],[265,"Hair Care Services",0],[5175,"Hair Care Services > Hair colorist",1],[5176,"Hair Care Services > Haircare appliance",1],[5177,"Hair Care Services > Hairdresser",1],[5178,"Hair Care Services > Hair Care Services - All else",1],[122,"Handtool and Cutlery Manufacture",0],[77,"Health Fundraising Organizations",0],[78,"Healthcare",0],[5181,"Healthcare > Alternative Medicine Healthcare",1],[9058,"Healthcare > Cancer Treatment Healthcare",1],[5184,"Healthcare > Cholesterol Healthcare",1],[5183,"Healthcare > Diabetes Healthcare",1],[5185,"Healthcare > Gender Specific Healthcare",1],[5179,"Healthcare > Health Services Healthcare",1],[5186,"Healthcare > Lactose Intolerance Healthcare",1],[5187,"Healthcare > Mental Healthcare",1],[5188,"Healthcare > Obesity intervention Healthcare",1],[5180,"Healthcare > Preventative Healthcare",1],[5189,"Healthcare > Respiratory and Cardiovascular Healthc are",1],[5190,"Healthcare > Skin Healthcare",1],[5182,"Healthcare > Weight loss Healthcare",1],[5191,"Healthcare > Healthcare - All else",1],[64,"Hedge Fund Management",0],[42,"Highway and Street Construction",0],[218,"Home Centers and Hardware Stores",0],[9358,"Home Centers and Hardware Stores > Appliance Repair",1],[5192,"Home Centers and Hardware Stores > Home Improvement",1],[9332,"Home Centers and Hardware Stores > Home Repair",1],[9302,"Home Centers and Hardware Stores > Paint and Paint Accessories",1],[9144,"Home Centers and Hardware Stores > Window Installation and Treatments",1],[9306,"Home Centers and Hardware Stores > Home Centers and Hardware Stores - All else",1],[219,"Home Furnishings Stores",0],[5194,"Home Furnishings Stores > Bathroom Store",1],[5196,"Home Furnishings Stores > Bedroom Store",1],[5198,"Home Furnishings Stores > Decoration Store",1],[5193,"Home Furnishings Stores > Kitchen Store",1],[5197,"Home Furnishings Stores > Living Room Store",1],[5195,"Home Furnishings Stores > Outdoor Store",1],[5199,"Home Furnishings Stores > Home Furnishing Stores - All else",1],[9224,"Home Goods Store",0],[79,"Home Healthcare Services",0],[9342,"Home Products",0],[9339,"Home Products > Bathroom Accessories",1],[9247,"Home Products > Carpets and Rugs",1],[9243,"Home Products > Fireplaces",1],[9248,"Home Products > Furniture",1],[9250,"Home Products > Furniture > BBQ, Grills, Outdoor Dining",2],[9249,"Home Products > Furniture > Baby and Toddler Furniture",2],[9251,"Home Products > Furniture > Beds and Accessories",2],[9252,"Home Products > Furniture > Benches",2],[9253,"Home Products > Furniture > Cabinets and Storage",2],[9254,"Home Products > Furniture > Chairs",2],[9255,"Home Products > Furniture > Entertainment Centers and TV Stands",2],[9256,"Home Products > Furniture > Furniture Sets",2],[9257,"Home Products > Furniture > Outdoor Furniture",2],[9258,"Home Products > Furniture > Shelving",2],[9259,"Home Products > Furniture > Sofas",2],[9260,"Home Products > Furniture > Tables",2],[9340,"Home Products > Home Decor",1],[9246,"Home Products > Housewares",1],[9341,"Home Products > Kitchen and Dining Products",1],[9244,"Home Products > Lighting",1],[9245,"Home Products > Linens and Bedding",1],[9338,"Home Products > Home Products - All else",1],[80,"Hospitals",0],[266,"Hotel and Motel - Lodging",0],[9209,"Hotel and Motel - Lodging > Hotels",1],[9211,"Hotel and Motel - Lodging > Motels",1],[9210,"Hotel and Motel - Lodging > Resorts",1],[9334,"Hotel and Motel - Lodging > Hotel and Motel - Lodging - All else",1],[123,"Household Appliance Manufacture",0],[5204,"Household Appliance Manufacture > Anti-theft",1],[9328,"Household Appliance Manufacture > Audio Accessories",1],[9262,"Household Appliance Manufacture > Body Scrubbers and Massage Devices",1],[9203,"Household Appliance Manufacture > Cameras and Accessories",1],[5210,"Household Appliance Manufacture > Coffee Maker",1],[5215,"Household Appliance Manufacture > Computer",1],[9293,"Household Appliance Manufacture > Connected Wearables",1],[5211,"Household Appliance Manufacture > Cooking appliances",1],[5216,"Household Appliance Manufacture > Copier/scanner",1],[5209,"Household Appliance Manufacture > DVD Player",1],[9263,"Household Appliance Manufacture > Dishwasher",1],[5218,"Household Appliance Manufacture > E-reader",1],[5203,"Household Appliance Manufacture > Fans",1],[5214,"Household Appliance Manufacture > Fax",1],[5202,"Household Appliance Manufacture > Heaters",1],[5207,"Household Appliance Manufacture > Irons",1],[9265,"Household Appliance Manufacture > Kettle",1],[5208,"Household Appliance Manufacture > Light Bulbs",1],[5206,"Household Appliance Manufacture > Ovens/stoves/microwaves",1],[9141,"Household Appliance Manufacture > Personal Audio",1],[9147,"Household Appliance Manufacture > Pressure Washer",1],[5217,"Household Appliance Manufacture > Printers",1],[5205,"Household Appliance Manufacture > Refrigerators",1],[9264,"Household Appliance Manufacture > Sewing Machine",1],[5213,"Household Appliance Manufacture > Tablet",1],[5212,"Household Appliance Manufacture > Television",1],[5201,"Household Appliance Manufacture > Vacuum",1],[5200,"Household Appliance Manufacture > Washing Machine/Dryers",1],[9148,"Household Appliance Manufacture > Water Purifier",1],[5219,"Household Appliance Manufacture > Household Appliance Manufacture - All else",1],[220,"Household Appliance Stores",0],[5221,"Household Appliance Stores > Electrical Store",1],[5220,"Household Appliance Stores > Household Store",1],[5222,"Household Appliance Stores > Household Appliance Stores - All else",1],[5223,"Household Tools",0],[5225,"Household Tools > Electric Handheld tools",1],[5224,"Household Tools > Handheld tools",1],[5226,"Household Tools > Nails, Screws, Bolts, etc.",1],[5227,"Household Tools > Household Tools - All else",1],[5228,"Housekeeping",0],[5236,"Housekeeping > Air fresheners",1],[9219,"Housekeeping > Carpet Cleaner",1],[5231,"Housekeeping > Detergents",1],[5232,"Housekeeping > Dish products",1],[9187,"Housekeeping > Dishwasher Powder",1],[9220,"Housekeeping > Floor Cleaner",1],[9273,"Housekeeping > Foils and Wraps",1],[5230,"Housekeeping > Food Storage products",1],[9146,"Housekeeping > Furniture Polish",1],[5233,"Housekeeping > Household cleaners",1],[5235,"Housekeeping > Household disinfectants",1],[9275,"Housekeeping > Laundry Care",1],[5229,"Housekeeping > Paper goods",1],[9274,"Housekeeping > Pest Control",1],[5234,"Housekeeping > Sponges, mops, cloths",1],[5237,"Housekeeping > Trash bags",1],[9301,"Housekeeping > Window and Glass Treatments",1],[5238,"Housekeeping > Housekeeping - All else",1],[5239,"Illegal Activities",0],[124,"Industrial Machinery Manufacturing",0],[361,"Industrial Machinery Wholesalers",0],[362,"Industrial Supply Wholesalers",0],[299,"Information Technology",0],[375,"Inland Barge Transport",0],[65,"Insurance Agencies",0],[5240,"Insurance Agencies > Building Agency",1],[5241,"Insurance Agencies > Car Agency",1],[5246,"Insurance Agencies > Commercial Agency",1],[5242,"Insurance Agencies > Health Agency",1],[5243,"Insurance Agencies > Home Agency",1],[5247,"Insurance Agencies > Life Agency",1],[5244,"Insurance Agencies > Pet Agency",1],[5245,"Insurance Agencies > Travel Agency",1],[5248,"Insurance Agencies > Insurance Agencies - All else",1],[66,"Insurance Carriers",0],[5249,"Insurance Carriers > Building Carriers",1],[5250,"Insurance Carriers > Car Carriers",1],[5255,"Insurance Carriers > Commercial Carriers",1],[5251,"Insurance Carriers > Health Carriers",1],[5252,"Insurance Carriers > Home Carriers",1],[5256,"Insurance Carriers > Life Carriers",1],[5253,"Insurance Carriers > Pet Carriers",1],[5254,"Insurance Carriers > Travel Carriers",1],[5257,"Insurance Carriers > Insurance Carriers - All else",1],[267,"Interior Design Services",0],[5258,"Internet",0],[9283,"Internet > Cloud Services",1],[9298,"Internet > Digital Media and Game Virtual Store",1],[5259,"Internet > Internet Comparison Service",1],[5260,"Internet > Internet Dating",1],[5262,"Internet > Internet Social Networking",1],[5261,"Internet > Internet gaming",1],[5263,"Internet > Search Engine",1],[9297,"Internet > Streaming Service",1],[9296,"Internet > Web Hosting",1],[5264,"Internet > Internet - All else",1],[268,"Internet Service Providers",0],[221,"Internet and Catalog Retailers",0],[5265,"Internet and Catalog Retailers > Internet Auction",1],[5266,"Internet and Catalog Retailers > Various/Catalog",1],[5267,"Internet and Catalog Retailers > Internet and Catalog Retailers - All else",1],[67,"Investment Banking",0],[269,"Janitorial Services and Carpet Cleaning",0],[222,"Jewelry Retail",0],[81,"Kidney Dialysis Centers",0],[44,"Landscaping Services",0],[68,"Legal Services",0],[9184,"Legal Services > Injury Health Claims",1],[9688,"Legal Services > Lawsuits - Class Action and Personal Injury",1],[9369,"Legal Services > Legal Services - All else",1],[125,"Lighting Equipment Manufacture",0],[272,"Linen and Uniform Supply Services",0],[176,"Local Bus Transportation",0],[45,"Lumber Wholesalers",0],[126,"Machine Shops",0],[127,"Machine Tool Manufacture",0],[301,"Magazine Publishers",0],[5268,"Magazine Publishers > Men's Magazines",1],[5269,"Magazine Publishers > Women's Magazines",1],[5270,"Magazine Publishers > Magazine Publishers - All else",1],[82,"Managed Healthcare",0],[5271,"Managed Healthcare > Managed Health Services",1],[5272,"Managed Healthcare > Managed Healthcare - All else",1],[5273,"Management Consulting",0],[46,"Manufactured Housing",0],[376,"Manufacturing Sector",0],[177,"Marinas",0],[273,"Market Research Services",0],[364,"Material Handling Equipment Distribution",0],[20,"Meat Products Manufacture",0],[83,"Medical & Imaging Laboratories",0],[5274,"Medical & Imaging Laboratories > Medical Imaging equipment",1],[5275,"Medical & Imaging Laboratories > Medical & Imaging Laboratories - All else",1],[84,"Medical Equipment Distributors",0],[85,"Medical Supplies and Devices",0],[5276,"Medical Supplies and Devices > Medical Assistance products",1],[5277,"Medical Supplies and Devices > Medical Supplies and Devices - All else",1],[130,"Metal Coating, Engraving, & Heat Treating",0],[131,"Metal Ore Mining",0],[132,"Metal Valve Manufacture",0],[69,"Mortgage Banking",0],[133,"Motor, Generator, Pump, and Compressor Mfg",0],[223,"Motorcycle Dealers",0],[134,"Motorcycle Manufacturing",0],[5278,"Motorcycle Manufacturing > Motorcycle accessories",1],[5279,"Motorcycle Manufacturing > Motorcycle Manufacturing - All else",1],[178,"Movie Theatres",0],[303,"Movies & TV Production and Distribution",0],[5280,"Movies & TV Production and Distribution > Cinema Genre",1],[5281,"Movies & TV Production and Distribution > Cinema Genre > Action/thriller Cinema",2],[5282,"Movies & TV Production and Distribution > Cinema Genre > Comedy Cinema",2],[5283,"Movies & TV Production and Distribution > Cinema Genre > Drama Cinema",2],[5284,"Movies & TV Production and Distribution > Cinema Genre > Family/Kids Cinema",2],[5286,"Movies & TV Production and Distribution > Cinema Genre > Sci-Fi/Horror Cinema",2],[5285,"Movies & TV Production and Distribution > Cinema Genre > War/Historical/Factual/Documentary Cinema",2],[5287,"Movies & TV Production and Distribution > Cinema Genre > Cinema Genre - All else",2],[5295,"Movies & TV Production and Distribution > DVD/video Genre",1],[5296,"Movies & TV Production and Distribution > DVD/video Genre > Action/thriller",2],[5297,"Movies & TV Production and Distribution > DVD/video Genre > Comedy",2],[5298,"Movies & TV Production and Distribution > DVD/video Genre > Drama",2],[5299,"Movies & TV Production and Distribution > DVD/video Genre > Family/Kids",2],[5301,"Movies & TV Production and Distribution > DVD/video Genre > Fitness/Health",2],[5300,"Movies & TV Production and Distribution > DVD/video Genre > Sci-Fi/Horror",2],[5302,"Movies & TV Production and Distribution > DVD/video Genre > War/Historical/Factual/Documentary",2],[5303,"Movies & TV Production and Distribution > DVD/video Genre > DVD/video gene - All else",2],[5288,"Movies & TV Production and Distribution > Ratings",1],[5289,"Movies & TV Production and Distribution > Ratings > Rating: G 5293 Movies & TV Production and Distribution > Ratings > Rating: NC-17",4],[5290,"Movies & TV Production and Distribution > Ratings > Rating: PG",2],[5291,"Movies & TV Production and Distribution > Ratings > Rating: PG-13",2],[5292,"Movies & TV Production and Distribution > Ratings > Rating: R",2],[5294,"Movies & TV Production and Distribution > Ratings > Ratings - All else",2],[5304,"Movies & TV Production and Distribution > Movies & TV Production and Distribution - All else",1],[336,"Moving and Storage",0],[5305,"Delivery Services",0],[179,"Municipal Governments",0],[5307,"Municipal Governments > Anti- Drink & Drive",1],[5309,"Municipal Governments > Anti-smoking ad",1],[5306,"Municipal Governments > COI",1],[5308,"Municipal Governments > Road Safety",1],[5310,"Municipal Governments > Municipal Governments - All else",1],[180,"Museums, Zoos, and Parks",0],[304,"Music Production and Distribution",0],[9150,"Music Production and Distribution > Adult Contemporary",1],[5311,"Music Production and Distribution > Classical",1],[5312,"Music Production and Distribution > Concert",1],[5313,"Music Production and Distribution > Dance",1],[5314,"Music Production and Distribution > Disco",1],[5315,"Music Production and Distribution > Indie",1],[5316,"Music Production and Distribution > Kids Music",1],[5317,"Music Production and Distribution > Pop",1],[5318,"Music Production and Distribution > R&B",1],[5319,"Music Production and Distribution > Rap",1],[9151,"Music Production and Distribution > Retro",1],[5320,"Music Production and Distribution > Rock",1],[5321,"Music Production and Distribution > Spoken",1],[5322,"Music Production and Distribution > Music Production and Distribution - All else",1],[224,"Music Stores",0],[135,"Musical Instrument Manufacture",0],[225,"Musical Instrument Stores",0],[181,"Natural Gas Production and Distribution",0],[305,"Newspapers and News Organizations",0],[5323,"Non-alcoholic beverages",0],[5328,"Non-alcoholic beverages > Coffee",1],[5330,"Non-alcoholic beverages > Energy drinks",1],[9234,"Non-alcoholic beverages > Flavored Milk and Milk Drinks",1],[9267,"Non-alcoholic beverages > Flavored Water",1],[5326,"Non-alcoholic beverages > Juice",1],[5327,"Non-alcoholic beverages > Milk",1],[9266,"Non-alcoholic beverages > Non-Alcoholic Aperitifs, Beer, Wine, and Mocktails",1],[5325,"Non-alcoholic beverages > Soda",1],[5329,"Non-alcoholic beverages > Tea",1],[5324,"Non-alcoholic beverages > Water",1],[5331,"Non-alcoholic beverages > Non-alcoholic beverages - All else",1],[338,"Nonmetallic Mineral Mining and Quarrying",0],[182,"Nonprofit Institutions",0],[5332,"Nonprofit Institutions > Charity",1],[5333,"Nonprofit Institutions > Issues and Awareness",1],[5334,"Nonprofit Institutions > Nonprofit Institutions - All else",1],[21,"Nurseries",0],[86,"Nursing Homes and Assisted Living",0],[367,"Office Supply and Paper Distribution",0],[5335,"Office Supply and Paper Distribution > Stationery",1],[5336,"Office Supply and Paper Distribution > Writing instruments",1],[5337,"Office Supply and Paper Distribution > Office Supply and Paper Distribution - All else",1],[339,"Oil and Gas Exploration and Production",0],[136,"Oil and Gas Field Services",0],[87,"Optometrists and Opticians",0],[88,"Outpatient Surgical Centers",0],[137,"Paint and Coating Manufacturing",0],[47,"Painting and Wall Covering Contractors",0],[138,"Paper Products Manufacture",0],[5338,"Pawnbrokers",0],[274,"Personnel Staffing Agencies",0],[5341,"Personnel Staffing Agencies > Business Recruitment",1],[5340,"Personnel Staffing Agencies > Job Searching and Career Management platforms",1],[5339,"Personnel Staffing Agencies > Temporary Staffing",1],[5342,"Personnel Staffing Agencies > Personnel Staffing Agencies - All else",1],[22,"Pest Control Services",0],[9190,"Pet Care and Services",0],[9370,"Pet Care and Services > Pet Breeders",1],[9371,"Pet Care and Services > Pet Grooming",1],[9372,"Pet Care and Services > Pet Sitting",1],[9373,"Pet Care and Services > Pet Supplies",1],[9374,"Pet Care and Services > Pet Treats",1],[9375,"Pet Care and Services > Pet Care and Services - All else",1],[139,"Pet Food Manufacture",0],[228,"Pet Stores",0],[5343,"Pet Litter",0],[140,"Petroleum Refining",0],[342,"Petroleum Wholesale Distribution",0],[373,"Pharmaceutical Manufacture and Sale - over the counter",0],[9291,"Pharmaceutical Manufacture and Sale - over the counter > Alcohol Dependence",1],[5350,"Pharmaceutical Manufacture and Sale - over the counter > Allergy",1],[9285,"Pharmaceutical Manufacture and Sale - over the counter > Anti-Diarrhea",1],[9286,"Pharmaceutical Manufacture and Sale - over the counter > Anti-Nausea",1],[9284,"Pharmaceutical Manufacture and Sale - over the counter > Anti-Snoring",1],[5345,"Pharmaceutical Manufacture and Sale - over the counter > Anti-smoking aid",1],[5358,"Pharmaceutical Manufacture and Sale - over the counter > Bandages",1],[5351,"Pharmaceutical Manufacture and Sale - over the counter > Condom",1],[5352,"Pharmaceutical Manufacture and Sale - over the counter > Contraception",1],[5344,"Pharmaceutical Manufacture and Sale - over the counter > Cough Flu-analgesics",1],[5348,"Pharmaceutical Manufacture and Sale - over the counter > Digestion/Laxative",1],[5346,"Pharmaceutical Manufacture and Sale - over the counter > Disinfectant/antiseptic",1],[9331,"Pharmaceutical Manufacture and Sale - over the counter > Ear Products",1],[5353,"Pharmaceutical Manufacture and Sale - over the counter > Foot care",1],[5347,"Pharmaceutical Manufacture and Sale - over the counter > Hearing devices",1],[5356,"Pharmaceutical Manufacture and Sale - over the counter > Indigestion",1],[5363,"Pharmaceutical Manufacture and Sale - over the counter > Insect Repellants",1],[5355,"Pharmaceutical Manufacture and Sale - over the counter > Men's Health",1],[9289,"Pharmaceutical Manufacture and Sale - over the counter > Menopause",1],[5362,"Pharmaceutical Manufacture and Sale - over the counter > Nasal products",1],[5360,"Pharmaceutical Manufacture and Sale - over the counter > Non-FDA approved Drugs",1],[5354,"Pharmaceutical Manufacture and Sale - over the counter > Optical",1],[5357,"Pharmaceutical Manufacture and Sale - over the counter > Painkiller",1],[5359,"Pharmaceutical Manufacture and Sale - over the counter > Pregnancy Test",1],[5361,"Pharmaceutical Manufacture and Sale - over the counter > Sleep Remedy",1],[5349,"Pharmaceutical Manufacture and Sale - over the counter > Vitamins",1],[5364,"Pharmaceutical Manufacture and Sale - over the counter > Pharmaceutical Manufacture and Sale - over the counter - All else",1],[89,"Pharmaceutical Manufacture and Sale - prescription",0],[5367,"Pharmaceutical Manufacture and Sale - prescription > Allergy Prescription",1],[9060,"Pharmaceutical Manufacture and Sale - prescription > Arthritis Prescription",1],[9063,"Pharmaceutical Manufacture and Sale - prescription > Asthma Prescription",1],[9064,"Pharmaceutical Manufacture and Sale - prescription > Blood Sugar & Diabetes Prescription",1],[9059,"Pharmaceutical Manufacture and Sale - prescription > Cancer Prescription",1],[5369,"Pharmaceutical Manufacture and Sale - prescription > Cough Flu-analgesics Prescription",1],[9693,"Pharmaceutical Manufacture and Sale - prescription > Dupuytren's Contracture & Peyronie's disease prescription",1],[5368,"Pharmaceutical Manufacture and Sale - prescription > Erectile Dysfunction products Prescription",1],[9690,"Pharmaceutical Manufacture and Sale - prescription > Eye disease prescription",1],[9695,"Pharmaceutical Manufacture and Sale - prescription > Gastrointestinal Relief/Digestion Prescription",1],[9061,"Pharmaceutical Manufacture and Sale - prescription > HIV & Aids Prescription",1],[9067,"Pharmaceutical Manufacture and Sale - prescription > Heart and Cardiovascular Prescription",1],[9290,"Pharmaceutical Manufacture and Sale - prescription > Hemorrhoid Prescription",1],[9062,"Pharmaceutical Manufacture and Sale - prescription > Infectious Diseases & Viruses Prescription",1],[9691,"Pharmaceutical Manufacture and Sale - prescription > Involuntary movement prescription",1],[9689,"Pharmaceutical Manufacture and Sale - prescription > Lupus prescription",1],[9288,"Pharmaceutical Manufacture and Sale - prescription > Menopause Prescription",1],[9066,"Pharmaceutical Manufacture and Sale - prescription > Mental Health Prescription",1],[9696,"Pharmaceutical Manufacture and Sale - prescription > Multiple Sclerosis Prescription",1],[9694,"Pharmaceutical Manufacture and Sale - prescription > Opioid Overdose treatment",1],[9692,"Pharmaceutical Manufacture and Sale - prescription > Osteoporosis prescription",1],[5365,"Pharmaceutical Manufacture and Sale - prescription > Painkillers Prescription",1],[9065,"Pharmaceutical Manufacture and Sale - prescription > Skin Conditions Prescription",1],[5366,"Pharmaceutical Manufacture and Sale - prescription > Sleep Remedy Prescription",1],[9149,"Pharmaceutical Manufacture and Sale - prescription > Thrush Prescription",1],[9287,"Pharmaceutical Manufacture and Sale - prescription > Vaccines",1],[5370,"Pharmaceutical Manufacture and Sale - prescription > Pharmaceutical Manufacture and Sale - prescription - All else",1],[276,"Photo Studios and Commercial Photography",0],[229,"Photofinishing and Camera Stores",0],[90,"Physician Offices",0],[5371,"Piracy",0],[143,"Plastic Resins & Synthetic Fibers",0],[142,"Plastic and Rubber Products Manufacturing",0],[9127,"Political Issues and Policy",0],[9570,"Political Issues and Policy > Candidate PAC",1],[9577,"Political Issues and Policy > Crime",1],[9579,"Political Issues and Policy > Education",1],[9602,"Political Issues and Policy > Election Awareness",1],[9576,"Political Issues and Policy > Election law",1],[9574,"Political Issues and Policy > Environment / oil and gas",1],[9573,"Political Issues and Policy > Gambling",1],[9578,"Political Issues and Policy > Religion",1],[9572,"Political Issues and Policy > Same-sex marriage / LG BTQ+ rights",1],[9571,"Political Issues and Policy > Sexual reproduction (abortion)",1],[9575,"Political Issues and Policy > Taxation",1],[9580,"Political Issues and Policy > Workers rights / minimum wage",1],[9581,"Political Issues and Policy > Political Issues and Policy - All else",1],[9814,"Political Parties",0],[9815,"Political Parties > Local Party",1],[9817,"Political Parties > National Party",1],[9816,"Political Parties > State Party",1],[378,"Politicians",0],[9813,"Politicians > Councillor",1],[9811,"Politicians > Governor/ Premier",1],[9585,"Politicians > State House/ Legislative Assembly",1],[9583,"Politicians > State Senate/ Legislative Council",1],[9584,"Politicians > House of Representatives (Federal)",1],[9812,"Politicians > Mayor",1],[9586,"Politicians > President/ Prime Minister",1],[9582,"Politicians > Senate (Federal)",1],[9587,"Politicians > Politicians - All else",1],[9261,"Pool and Spa Installation and Maintenance",0],[23,"Poultry Processing",0],[144,"Primary Metals Manufacturing",0],[183,"Private Schools K-12",0],[277,"Professional Services",0],[184,"Professional Sports Teams and Organizations",0],[5372,"Professional Sports Teams and Organizations > Athletic Governing Bodies",1],[306,"Public Relations",0],[185,"Public Schools K-12",0],[145,"Pulp and Paper Mills",0],[307,"Radio Broadcasting and Programming",0],[146,"Railroad Equipment Manufacturing",0],[343,"Railroads",0],[48,"Real Estate Brokerage and Management",0],[5373,"Real Estate Brokerage and Management > Real Estate - Housing",1],[5374,"Real Estate Brokerage and Management > Real Estate - Offices",1],[5375,"Real Estate Brokerage and Management > Real Estate Agencies",1],[5376,"Real Estate Brokerage and Management > Real Estate Brokerage and Management - All else",1],[49,"Real Estate Investment Trusts (REITs)",0],[9188,"Recreational Sports Equipment",0],[230,"Recreational Vehicle Dealers",0],[147,"Recreational Vehicle Manufacture",0],[186,"Recreational Vehicle Parks",0],[9330,"Recycling",0],[91,"Rehabilitation Therapy Practices",0],[50,"Residential Real Estate Construction",0],[24,"Restaurants",0],[5378,"Restaurants > Food delivery Service",1],[5377,"Restaurants > Take out Restaurants",1],[5379,"Restaurants > Restaurants - All else",1],[9345,"Retail Subscription Services",0],[9346,"Retail Subscription Services > Clothing Subscriptions",1],[9347,"Retail Subscription Services > Grocery Subscriptions",1],[9348,"Retail Subscription Services > Makeup and Beauty Subscriptions",1],[9292,"Retail Subscription Services > Meal Kit Services",1],[9350,"Retail Subscription Services > Personal Care Subscriptions",1],[9349,"Retail Subscription Services > Pet Food and Supply Subscriptions",1],[9351,"Retail Subscription Services > Vitamin and Supplement Subscriptions",1],[9352,"Retail Subscription Services > Wine Subscriptions",1],[9353,"Retail Subscription Services > Retail Subscription Services - All else",1],[389,"Retail and General Merchandise",0],[9326,"Retail and General Merchandise > Local Stores",1],[9324,"Retail and General Merchandise > Shopping Centers",1],[5380,"Retail and General Merchandise > Teleshopping",1],[9356,"Retail and General Merchandise > Retail and General Merchandise - All else",1],[51,"Roofing, Siding, and Sheet Metal Contractors",0],[308,"Sales Promotion Services",0],[148,"Sawmills and Plywood Mills",0],[149,"Scrap Metals-Recycling",0],[150,"Search, Detection, and Navigation Equipment Manufacture",0],[71,"Securities Brokers",0],[52,"Security System Services",0],[5382,"Security System Services > Security System Services > Fire Alarms",2],[5381,"Security System Services > Security System Services > Household security",2],[5383,"Security System Services > Security System Services > Security System Services - All else",2],[232,"Shoe Stores",0],[53,"Site Preparation Contractors",0],[187,"Ski Facilities",0],[151,"Soap and Detergent Manufacture",0],[9157,"Software Applications",0],[9162,"Software Applications > Antivirus Software",1],[9163,"Software Applications > Browsers",1],[9164,"Software Applications > Computer Animation",1],[9165,"Software Applications > Databases",1],[9166,"Software Applications > Desktop Publishing",1],[9167,"Software Applications > Digital Audio",1],[9168,"Software Applications > Graphics Software",1],[9171,"Software Applications > Messaging Software",1],[9169,"Software Applications > Operating Systems",1],[9158,"Software Applications > Photo Editing Software",1],[9170,"Software Applications > Productivity Software",1],[9159,"Software Applications > Shareware and Freeware",1],[9160,"Software Applications > Video Software",1],[9161,"Software Applications > Web Conferencing",1],[9354,"Software Applications > Software Applications - All else",1],[188,"Spa Services",0],[233,"Specialty Food Stores",0],[5395,"Specialty Food Stores > Health Food Store",1],[5394,"Specialty Food Stores > Non-Allergy",1],[5396,"Specialty Food Stores > Specialty Food Stores - All else",1],[234,"Specialty Retail",0],[377,"Spirits, Liquor Producers & Distilleries",0],[5397,"Spirits, Liquor Producers & Distilleries > Beer/Cider/Lager Producer & Distillery",1],[5399,"Spirits, Liquor Producers & Distilleries > Spirits Producer & Distillery",1],[5398,"Spirits, Liquor Producers & Distilleries > Wine Producer & Distillery",1],[5400,"Spirits, Liquor Producers & Distilleries > Spirits, Liquor Producers & Distilleries - All else",1],[189,"Sporting Goods Retailers",0],[9194,"Sporting Goods Retailers > Golf Store",1],[5401,"Sporting Goods Retailers > indoor sports equipment",1],[5402,"Sporting Goods Retailers > outdoor sports equipment",1],[5403,"Sporting Goods Retailers > outdoor sports equipment > Golf Accessories",2],[5404,"Sporting Goods Retailers > outdoor sports equipment > Golf Apparel",2],[5405,"Sporting Goods Retailers > outdoor sports equipment > Golf Bags",2],[5406,"Sporting Goods Retailers > outdoor sports equipment > Golf Balls",2],[5407,"Sporting Goods Retailers > outdoor sports equipment > Golf Carts",2],[5408,"Sporting Goods Retailers > outdoor sports equipment > Golf Clubs",2],[5410,"Sporting Goods Retailers > outdoor sports equipment > Golf GPS/Rangefinder",2],[5409,"Sporting Goods Retailers > outdoor sports equipment > Golf Gloves",2],[5411,"Sporting Goods Retailers > outdoor sports equipment > Golf Grips",2],[9218,"Sporting Goods Retailers > outdoor sports equipment > Golf Putter",2],[5412,"Sporting Goods Retailers > outdoor sports equipment > Golf Shafts",2],[5413,"Sporting Goods Retailers > outdoor sports equipment > Golf Shoes",2],[5414,"Sporting Goods Retailers > outdoor sports equipment > Golf Training Aids",2],[5415,"Sporting Goods Retailers > outdoor sports equipment > Tennis Equipment",2],[5416,"Sporting Goods Retailers > Sporting Goods Retailers - All else",1],[5417,"Sports Betting",0],[379,"State and Federal Government",0],[371,"Steel Distribution",0],[54,"Structural Metals Manufacture",0],[25,"Sugar Manufacturing",0],[312,"TV Cable, Pay & Broadcast Networks",0],[9221,"TV Cable, Pay & Broadcast Networks > Media Content TV Channel",1],[5464,"TV Cable, Pay & Broadcast Networks > TV Licensing",1],[9337,"TV Cable, Pay & Broadcast Networks > TV Cable, Pay & Broadcast Networks - All else",1],[280,"Taxi and Limousine Services",0],[310,"Technology Sector",0],[281,"Telecommunication Services",0],[9142,"Telecommunication Services > Directory Assistance Services",1],[5418,"Telecommunication Services > Telephone Networks",1],[5419,"Telecommunication Services > Telephone Stores",1],[5420,"Telecommunication Services > Telecommunication Services - All else",1],[154,"Telecommunications Equipment Manufacturers",0],[5422,"Telecommunications Equipment Manufacturers > Handset/Mobile",1],[5421,"Telecommunications Equipment Manufacturers > Telephone Accessories",1],[5423,"Telecommunications Equipment Manufacturers > Telecommunications Equipment Manufacturers - All else",1],[282,"Telemarketing Services",0],[283,"Testing Laboratories",0],[155,"Textile Manufacturing",0],[26,"Timber Operations",0],[236,"Tire Dealers",0],[156,"Tire Manufacturers",0],[372,"Tire Wholesalers",0],[55,"Title Insurance Services",0],[381,"Tobacco & Smoking Paraphernalia",0],[5425,"Tobacco & Smoking Paraphernalia > Marijuana",1],[5424,"Tobacco & Smoking Paraphernalia > e-cigarette",1],[5426,"Tobacco & Smoking Paraphernalia > Tobacco & Smoking Paraphernalia - All else",1],[27,"Tobacco Manufacture",0],[5384,"Toiletries",0],[5385,"Toiletries > Anti-perspirant/Deodorant/ Body Spray",1],[5391,"Toiletries > Body wash and Soap",1],[5389,"Toiletries > Children's toiletries",1],[5390,"Toiletries > Cleanser/acne cream",1],[5386,"Toiletries > Dental Products (toothpaste, toothbrush,floss etc.)",1],[9193,"Toiletries > Floss",1],[9281,"Toiletries > Teeth Whiteners",1],[9192,"Toiletries > Toothbrush",1],[9191,"Toiletries > Toothpaste",1],[9204,"Toiletries > Facial Tissue",1],[9278,"Toiletries > Incontinence Products",1],[5387,"Toiletries > Men's shaving products",1],[5392,"Toiletries > Personal care baby products",1],[9277,"Toiletries > Toilet Tissue",1],[5388,"Toiletries > Women's shaving products",1],[5393,"Toiletries > Toiletries - All else",1],[158,"Toy Manufacture",0],[5455,"Toy Manufacture > Action Figure",1],[5443,"Toy Manufacture > Baby Toys (0-3 yrs.)",1],[9205,"Toy Manufacture > Ball Game",1],[5454,"Toy Manufacture > Beads/Fashion",1],[5438,"Toy Manufacture > Board games",1],[5441,"Toy Manufacture > Board game - Adult",1],[5439,"Toy Manufacture > Board game - Child 4-8 yrs.",1],[5440,"Toy Manufacture > Board game - Child 8-12 yrs.",1],[5442,"Toy Manufacture > Board games - All else",1],[5437,"Toy Manufacture > Boy and girl toys",1],[5435,"Toy Manufacture > Boy toys",1],[5451,"Toy Manufacture > Car playset/Remote Control",1],[5450,"Toy Manufacture > Cars/Trucks/Trains",1],[9195,"Toy Manufacture > Toy Cars",1],[9197,"Toy Manufacture > Toy Trains",1],[9196,"Toy Manufacture > Toy Trucks",1],[5446,"Toy Manufacture > Collectibles",1],[5452,"Toy Manufacture > Construction Set",1],[9198,"Toy Manufacture > Toy Construction Over 7 years",1],[9199,"Toy Manufacture > Toy Construction Under 7 years",1],[5456,"Toy Manufacture > Cooking Set",1],[5445,"Toy Manufacture > Creative",1],[5449,"Toy Manufacture > Dolls",1],[9200,"Toy Manufacture > Fashion dolls",1],[9201,"Toy Manufacture > Interactive Feature Dolls",1],[9202,"Toy Manufacture > Mini, Micro, and Pocket Dolls",1],[5444,"Toy Manufacture > Educational",1],[9152,"Toy Manufacture > Electronic Toy",1],[5434,"Toy Manufacture > Gaming Consoles",1],[5436,"Toy Manufacture > Girl Toys",1],[9153,"Toy Manufacture > Interactive Toy",1],[5457,"Toy Manufacture > Kites/Gliders",1],[9154,"Toy Manufacture > Musical Toy",1],[5458,"Toy Manufacture > Outdoor",1],[5453,"Toy Manufacture > Paint/Draw",1],[5447,"Toy Manufacture > Playdoh",1],[5459,"Toy Manufacture > Robot",1],[5448,"Toy Manufacture > Role Play/Pretend Play",1],[5460,"Toy Manufacture > Skateboard/Scooter",1],[5461,"Toy Manufacture > Soft Toys",1],[9223,"Toy Manufacture > Trading Cards",1],[5462,"Toy Manufacture > Toy Manufacture - All else",1],[237,"Toy and Hobby Stores",0],[5431,"Toy and Hobby Stores > Board games Store",1],[5430,"Toy and Hobby Stores > Boy and girl toys Store",1],[5428,"Toy and Hobby Stores > Boy toys Store",1],[5427,"Toy and Hobby Stores > Gaming consoles Store",1],[5429,"Toy Manufacture > Girl Toys Store",1],[5432,"Toy and Hobby Stores > Toys for newborns",1],[5433,"Toy and Hobby Stores > Toy and Hobby Stores - All else",1],[9206,"Travel",0],[9207,"Travel > Domestic Travel",1],[9156,"Travel > Holiday Vacation Travel",1],[9208,"Travel > International Travel",1],[9212,"Travel > Rail Travel",1],[9155,"Travel > Travel Accessories",1],[9300,"Travel > Travel - All else",1],[190,"Travel Agencies and Services",0],[9213,"Travel Agencies and Services > Online Travel Services",1],[5463,"Travel Agencies and Services > Tourism",1],[159,"Truck and Bus Manufacturing",0],[347,"Trucking",0],[9787,"UK Less Healthy Foods",0],[9789,"UK Non-less Healthy Foods",0],[9788,"UK Less Healthy Foods Exemption",0],[238,"Used Merchandise Stores",0],[73,"Venture Capital",0],[28,"Veterinary Services",0],[5465,"Veterinary Services > Pet Medicine",1],[5466,"Veterinary Services > Veterinary Services - All else",1],[9294,"Virtual and Augmented Reality Devices",0],[239,"Warehouse Clubs and Superstores",0],[348,"Warehousing and Storage",0],[191,"Waste Management",0],[192,"Water & Sewer Utilities",0],[29,"Wineries",0],[314,"Wired Telecommunications Carriers",0],[315,"Wireless Telecommunications Services",0],[56,"Wood Flooring Manufacture",0]];

// FreeWheel industry GROUPS — rollups, NOT used for individual brand assignment.
// If a fact-table row has an industry_id matching one of these, it is a misuse.
const FW_GROUPS = [[428,"Aerospace"],[396,"Amusement and Recreation"],[397,"Apparel"],[435,"Apparel/Accessories"],[415,"Appliances"],[421,"Associations"],[432,"Audio and Video Equipment"],[399,"Automotive"],[400,"Beer/Wine/Liquor"],[401,"Beverages"],[393,"Business Services"],[430,"Commercial Printing"],[431,"Computing"],[409,"Computing Product"],[411,"Cosmetics/Toiletries"],[433,"Drug Stores"],[405,"Educational Services"],[392,"Entertainment"],[422,"Eye Care/Optical"],[419,"Filmed Entertainment"],[391,"Financial Services"],[394,"Food"],[414,"Gambling"],[413,"Gaming"],[398,"Government/Municipal"],[406,"Health Care Services"],[434,"Home Furnishings"],[412,"Household Products"],[436,"Insurance"],[418,"Jewelry"],[437,"Mail Order/Catalogue"],[390,"Manufacturing"],[420,"Media"],[429,"Military"],[439,"New Media"],[438,"News"],[408,"Office Equipment/Supplies"],[423,"Pet Food/Supplies"],[402,"Pharmaceuticals"],[424,"Photographic Equipment"],[410,"Product"],[425,"Professional Sports"],[404,"Publishing"],[416,"Real Estate"],[407,"Restaurant/Fast Food"],[403,"Retail Stores/Chains"],[417,"Telecommunications"],[426,"Tobacco"],[427,"Toys/Games"],[395,"Travel/Hotels/Airlines"]];

import React, { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Search, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, XCircle, Building2, Upload, FileCode2, X, Database, Layers, BookOpen, Filter } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// FreeWheel Advertiser · Brand · Industry Integrity Dashboard
// Canonical taxonomy: 1,094 actual industries + 50 industry groups
// (parsed from FreeWheel Streaming Hub User Guide, Apr 2026)
//
// Two integrity checks:
//   1. Unmapped — direct-sold rows (AM) with missing global brand/advertiser
//   2. Mismatch — same brand, different industry assigned by AM vs PG/MP
//   3. Group misuse — industry_id matches a GROUP (not an actual industry)
// ─────────────────────────────────────────────────────────────

// Build lookup maps from the embedded taxonomy
const INDUSTRY_BY_ID = new Map(FW_INDUSTRIES.map(([id, name, depth]) => [id, { id, name, depth }]));
const GROUP_BY_ID = new Map(FW_GROUPS.map(([id, name]) => [id, { id, name }]));

function classifyId(id) {
  if (id == null) return 'null';
  if (INDUSTRY_BY_ID.has(id)) return 'industry';
  if (GROUP_BY_ID.has(id)) return 'group';
  return 'unknown';
}

function industryName(id) {
  if (id == null) return null;
  const i = INDUSTRY_BY_ID.get(id);
  if (i) return i.name;
  const g = GROUP_BY_ID.get(id);
  if (g) return `[GROUP] ${g.name}`;
  return `[UNKNOWN ${id}]`;
}

// ─── MOCK DATA — using REAL FreeWheel industry IDs ───
// All IDs verified against canonical taxonomy.
// Mismatches model real Paramount AM-vs-FW disagreement patterns.

const MOCK_UNMAPPED = [
  { event_dt: '2026-04-22', gap_type: 'Missing advertiser + brand', placement_id: null, insertion_order_id: null, fw_advertiser_nm: null,               fw_brand_nm: null,  impressions: 4820000,  revenue: 62410  },
  { event_dt: '2026-04-21', gap_type: 'Missing brand',              placement_id: null, insertion_order_id: null, fw_advertiser_nm: 'Procter & Gamble',  fw_brand_nm: null,  impressions: 12450000, revenue: 148900 },
  { event_dt: '2026-04-20', gap_type: 'Missing brand',              placement_id: null, insertion_order_id: null, fw_advertiser_nm: 'Unilever',          fw_brand_nm: null,  impressions: 8220000,  revenue: 92400  },
  { event_dt: '2026-04-22', gap_type: 'Missing brand',              placement_id: null, insertion_order_id: null, fw_advertiser_nm: 'Toyota',            fw_brand_nm: null,  impressions: 6100000,  revenue: 78300  },
  { event_dt: '2026-04-21', gap_type: 'Missing advertiser + brand', placement_id: null, insertion_order_id: null, fw_advertiser_nm: null,               fw_brand_nm: null,  impressions: 2140000,  revenue: 31250  },
  { event_dt: '2026-04-22', gap_type: 'Missing advertiser + brand', placement_id: null, insertion_order_id: null, fw_advertiser_nm: null,               fw_brand_nm: null,  impressions: 1320000,  revenue: 19800  },
  { event_dt: '2026-04-20', gap_type: 'Missing advertiser',         placement_id: null, insertion_order_id: null, fw_advertiser_nm: null,               fw_brand_nm: 'Liquid Death Mountain Water', impressions: 910000, revenue: 14200 },
];

// All industry IDs below are REAL (from FW canonical taxonomy)
//   am_industry_id  = what AM tagged on direct-sold (sales_channel=2)
//   gb_industry_id  = what global_brand_dim has on the brand record (FW canonical)
//   ind_industry_id = what shows up on PG/MP/Exchange facts
const MOCK_MISMATCH = [
  // Auto — canonical example. AM tags as Dealerships (194); FW global brand says Manufacture (96).
  { global_brand_id: 1021011, global_brand_nm: 'Ford F-150 Lightning', pmnt_advertiser_nm: 'Ford Motor Company', pmnt_brand_nm: 'Ford F-150 Lightning', global_advertiser_nm: 'Ford Motor Company',
    am_industry_id: 194, gb_industry_id: 96, ind_industry_id: 96,
    am_impressions: 22400000, am_revenue: 298500, ind_impressions: 5200000, ind_revenue: 68400 },
  { global_brand_id: 1021012, global_brand_nm: 'Chevy Silverado EV', pmnt_advertiser_nm: 'Chevrolet', pmnt_brand_nm: 'Silverado EV', global_advertiser_nm: 'General Motors Holdings',
    am_industry_id: 194, gb_industry_id: 96, ind_industry_id: 96,
    am_impressions: 18700000, am_revenue: 241800, ind_impressions: 3900000, ind_revenue: 52100 },
  { global_brand_id: 1021013, global_brand_nm: 'Toyota bZ Woodland', pmnt_advertiser_nm: 'Toyota Motor Sales USA', pmnt_brand_nm: 'Toyota bZ Woodland', global_advertiser_nm: 'Toyota Motor Corporation',
    am_industry_id: 194, gb_industry_id: 96, ind_industry_id: 96,
    am_impressions: 6100000, am_revenue: 78300, ind_impressions: 2200000, ind_revenue: 28400 },

  // P&G brand-level industries — AM disagrees with FW global brand record per brand.
  { global_brand_id: 1023401, global_brand_nm: 'Olay', pmnt_advertiser_nm: 'Olay', pmnt_brand_nm: 'Olay Total Effects', global_advertiser_nm: 'Procter & Gamble',
    am_industry_id: 207, gb_industry_id: 5384, ind_industry_id: 5384,
    am_impressions: 3200000, am_revenue: 42100, ind_impressions: 5400000, ind_revenue: 62100 },
  { global_brand_id: 1023402, global_brand_nm: 'Tide', pmnt_advertiser_nm: 'Tide', pmnt_brand_nm: 'Tide Pods', global_advertiser_nm: 'Procter & Gamble',
    am_industry_id: 5228, gb_industry_id: 151, ind_industry_id: 151,
    am_impressions: 4100000, am_revenue: 51800, ind_impressions: 3900000, ind_revenue: 48200 },
  { global_brand_id: 1023403, global_brand_nm: 'Pampers', pmnt_advertiser_nm: 'Pampers', pmnt_brand_nm: 'Pampers Swaddlers', global_advertiser_nm: 'Procter & Gamble',
    am_industry_id: 9174, gb_industry_id: 5392, ind_industry_id: 5392,
    am_impressions: 2200000, am_revenue: 29100, ind_impressions: 2900000, ind_revenue: 38400 },
  { global_brand_id: 1023404, global_brand_nm: 'Crest', pmnt_advertiser_nm: 'Crest', pmnt_brand_nm: 'Crest 3D White', global_advertiser_nm: 'Procter & Gamble',
    am_industry_id: 5386, gb_industry_id: 5384, ind_industry_id: 5384,
    am_impressions: 1800000, am_revenue: 22400, ind_impressions: 2100000, ind_revenue: 27200 },
  { global_brand_id: 1023405, global_brand_nm: 'Pepto-Bismol', pmnt_advertiser_nm: 'Pepto-Bismol', pmnt_brand_nm: 'Pepto-Bismol Liquid', global_advertiser_nm: 'Procter & Gamble',
    am_industry_id: 5356, gb_industry_id: 373, ind_industry_id: 373,
    am_impressions: 900000, am_revenue: 14100, ind_impressions: 1100000, ind_revenue: 17600 },

  // QSR vs Restaurants
  { global_brand_id: 1024401, global_brand_nm: "McDonald's Breakfast", pmnt_advertiser_nm: "McDonald's USA", pmnt_brand_nm: "McDonald's Breakfast", global_advertiser_nm: "McDonald's Corporation",
    am_industry_id: 15, gb_industry_id: 24, ind_industry_id: 24,
    am_impressions: 19800000, am_revenue: 225600, ind_impressions: 4100000, ind_revenue: 48900 },

  // Telecom — Wireless vs generic. Indirect overridden separately (matches AM, not GB).
  { global_brand_id: 1025501, global_brand_nm: 'T-Mobile 5G Home', pmnt_advertiser_nm: 'T-Mobile USA', pmnt_brand_nm: 'T-Mobile 5G Home Internet', global_advertiser_nm: 'T-Mobile US, Inc.',
    am_industry_id: 315, gb_industry_id: 281, ind_industry_id: 315,
    am_impressions: 14100000, am_revenue: 198400, ind_impressions: 3400000, ind_revenue: 44800 },

  // Pharma — Rx vs OTC
  { global_brand_id: 1026601, global_brand_nm: 'Paxlovid', pmnt_advertiser_nm: 'Pfizer', pmnt_brand_nm: 'Paxlovid', global_advertiser_nm: 'Pfizer Inc.',
    am_industry_id: 89, gb_industry_id: 373, ind_industry_id: 373,
    am_impressions: 9400000, am_revenue: 167200, ind_impressions: 2800000, ind_revenue: 51200 },

  // GROUP MISUSE — global brand record points to a group ID, not an actual industry.
  { global_brand_id: 1027701, global_brand_nm: 'Hertz Car Rental', pmnt_advertiser_nm: 'Hertz', pmnt_brand_nm: 'Hertz Car Rental', global_advertiser_nm: 'Hertz Global Holdings',
    am_industry_id: 244, gb_industry_id: 399, ind_industry_id: 399,
    am_impressions: 1800000, am_revenue: 22400, ind_impressions: 4100000, ind_revenue: 51200 },
  // GROUP MISUSE on AM side
  { global_brand_id: 1027702, global_brand_nm: 'Pizza Hut Delivery', pmnt_advertiser_nm: 'Pizza Hut', pmnt_brand_nm: 'Pizza Hut Delivery', global_advertiser_nm: 'Yum! Brands',
    am_industry_id: 407, gb_industry_id: 24, ind_industry_id: 24,
    am_impressions: 4500000, am_revenue: 56700, ind_impressions: 2200000, ind_revenue: 27800 },

  // Aligned (AM agrees with global brand record)
  { global_brand_id: 1028801, global_brand_nm: 'Mountain Dew Baja Blast', pmnt_advertiser_nm: 'PepsiCo Beverages', pmnt_brand_nm: 'Mountain Dew Baja Blast', global_advertiser_nm: 'PepsiCo, Inc.',
    am_industry_id: 5325, gb_industry_id: 5325, ind_industry_id: 5325,
    am_impressions: 15200000, am_revenue: 182000, ind_impressions: 4800000, ind_revenue: 54200 },

  // Indirect-only orphan — no AM record, but global brand has industry
  { global_brand_id: 1029901, global_brand_nm: 'Samsung Galaxy S26 Ultra', pmnt_advertiser_nm: null, pmnt_brand_nm: null, global_advertiser_nm: 'Samsung Electronics',
    am_industry_id: null, gb_industry_id: 205, ind_industry_id: 205,
    am_impressions: null, am_revenue: null, ind_impressions: 6700000, ind_revenue: 82300 },

  // ─── Concentration scenario A: many auto brands collapsed under top-level "Automobile Manufacture" (96) ───
  // Real Paramount pattern: every auto manufacturer ad fights for one break slot.
  // 96 has children: 9314 Budget Cars, 9315 Crossover, 9316 Luxury Cars, 9317 City Cars, 9318 Micro Cars, 4974 Car/Van, etc.
  { global_brand_id: 1031001, global_brand_nm: 'BMW 5 Series', pmnt_advertiser_nm: 'BMW of North America', pmnt_brand_nm: 'BMW 5 Series', global_advertiser_nm: 'BMW Group',         am_industry_id: 96, gb_industry_id: 96, ind_industry_id: 96, am_impressions: 8200000, am_revenue: 124000, ind_impressions: 1400000, ind_revenue: 21800 },
  { global_brand_id: 1031002, global_brand_nm: 'Mercedes-Benz GLE', pmnt_advertiser_nm: 'Mercedes-Benz USA', pmnt_brand_nm: 'Mercedes-Benz GLE', global_advertiser_nm: 'Mercedes-Benz Group',    am_industry_id: 96, gb_industry_id: 96, ind_industry_id: 96, am_impressions: 7100000, am_revenue: 106500, ind_impressions: 1200000, ind_revenue: 18900 },
  { global_brand_id: 1031003, global_brand_nm: 'Lexus RX', pmnt_advertiser_nm: 'Lexus', pmnt_brand_nm: 'Lexus RX', global_advertiser_nm: 'Toyota Motor Corporation',             am_industry_id: 96, gb_industry_id: 96, ind_industry_id: 96, am_impressions: 5800000, am_revenue: 87200, ind_impressions: 980000, ind_revenue: 14600 },
  { global_brand_id: 1031004, global_brand_nm: 'Audi Q5', pmnt_advertiser_nm: 'Audi of America', pmnt_brand_nm: 'Audi Q5', global_advertiser_nm: 'Volkswagen Group',              am_industry_id: 96, gb_industry_id: 96, ind_industry_id: 96, am_impressions: 4900000, am_revenue: 73500, ind_impressions: 850000, ind_revenue: 12700 },
  { global_brand_id: 1031005, global_brand_nm: 'Hyundai Kona', pmnt_advertiser_nm: 'Hyundai Motor America', pmnt_brand_nm: 'Hyundai Kona', global_advertiser_nm: 'Hyundai Motor Company',         am_industry_id: 96, gb_industry_id: 96, ind_industry_id: 96, am_impressions: 6300000, am_revenue: 84200, ind_impressions: 1100000, ind_revenue: 14900 },
  { global_brand_id: 1031006, global_brand_nm: 'Kia Sportage', pmnt_advertiser_nm: 'Kia America', pmnt_brand_nm: 'Kia Sportage', global_advertiser_nm: 'Hyundai Motor Group',         am_industry_id: 96, gb_industry_id: 96, ind_industry_id: 96, am_impressions: 5400000, am_revenue: 72100, ind_impressions: 940000, ind_revenue: 12800 },
  { global_brand_id: 1031007, global_brand_nm: 'Mazda CX-50', pmnt_advertiser_nm: 'Mazda North American Ops', pmnt_brand_nm: 'Mazda CX-50', global_advertiser_nm: 'Mazda Motor Corporation',          am_industry_id: 96, gb_industry_id: 96, ind_industry_id: 96, am_impressions: 3800000, am_revenue: 51200, ind_impressions: 620000, ind_revenue: 8400 },

  // ─── Concentration scenario B: pharma Rx all collapsed under 89 ───
  // 89 has 27 children covering specific conditions — perfect grandchild candidates.
  { global_brand_id: 1032001, global_brand_nm: 'Humira', pmnt_advertiser_nm: 'AbbVie', pmnt_brand_nm: 'Humira', global_advertiser_nm: 'AbbVie Inc.',               am_industry_id: 89, gb_industry_id: 89, ind_industry_id: 89, am_impressions: 6400000, am_revenue: 134000, ind_impressions: 1100000, ind_revenue: 22400 },
  { global_brand_id: 1032002, global_brand_nm: 'Ozempic', pmnt_advertiser_nm: 'Novo Nordisk', pmnt_brand_nm: 'Ozempic', global_advertiser_nm: 'Novo Nordisk A/S',              am_industry_id: 89, gb_industry_id: 89, ind_industry_id: 89, am_impressions: 9800000, am_revenue: 218000, ind_impressions: 1900000, ind_revenue: 41100 },
  { global_brand_id: 1032003, global_brand_nm: 'Skyrizi', pmnt_advertiser_nm: 'AbbVie', pmnt_brand_nm: 'Skyrizi', global_advertiser_nm: 'AbbVie Inc.',              am_industry_id: 89, gb_industry_id: 89, ind_industry_id: 89, am_impressions: 5200000, am_revenue: 109000, ind_impressions: 880000, ind_revenue: 18200 },
  { global_brand_id: 1032004, global_brand_nm: 'Trulicity', pmnt_advertiser_nm: 'Eli Lilly and Company', pmnt_brand_nm: 'Trulicity', global_advertiser_nm: 'Eli Lilly and Company',            am_industry_id: 89, gb_industry_id: 89, ind_industry_id: 89, am_impressions: 4800000, am_revenue: 100000, ind_impressions: 760000, ind_revenue: 15800 },
  { global_brand_id: 1032005, global_brand_nm: 'Eliquis', pmnt_advertiser_nm: 'Bristol Myers Squibb', pmnt_brand_nm: 'Eliquis', global_advertiser_nm: 'Bristol Myers Squibb',              am_industry_id: 89, gb_industry_id: 89, ind_industry_id: 89, am_impressions: 7100000, am_revenue: 152000, ind_impressions: 1400000, ind_revenue: 29800 },

  // ─── Concentration scenario C: QSR collapsed under 15 ───
  // 15 (Fast Food and Quickservice Restaurants) has no children — no granularity option available.
  // Optimizer should NOT generate a suggestion here. (Validates negative case.)
  { global_brand_id: 1033001, global_brand_nm: "Wendy's 4 for $4", pmnt_advertiser_nm: "Wendy's", pmnt_brand_nm: "Wendy's 4 for $4", global_advertiser_nm: "The Wendy's Company",    am_industry_id: 15, gb_industry_id: 15, ind_industry_id: 15, am_impressions: 4200000, am_revenue: 47800, ind_impressions: 720000, ind_revenue: 8200 },
  { global_brand_id: 1033002, global_brand_nm: 'Taco Bell Cravings', pmnt_advertiser_nm: 'Taco Bell', pmnt_brand_nm: 'Taco Bell Cravings', global_advertiser_nm: 'Yum! Brands',   am_industry_id: 15, gb_industry_id: 15, ind_industry_id: 15, am_impressions: 5100000, am_revenue: 58200, ind_impressions: 890000, ind_revenue: 10100 },

  // ─── Over-granular scenario: single brand using a depth-2 leaf ───
  // 5023 = Consumer Finance > Loan > Car Loan. Only Capital One Auto here. No separation benefit.
  { global_brand_id: 1034001, global_brand_nm: 'Capital One Auto Navigator', pmnt_advertiser_nm: 'Capital One Financial', pmnt_brand_nm: 'Capital One Auto Navigator', global_advertiser_nm: 'Capital One Financial Corporation', am_industry_id: 5023, gb_industry_id: 5023, ind_industry_id: 5023, am_impressions: 1200000, am_revenue: 18400, ind_impressions: 220000, ind_revenue: 3400 },
];

// Compute status from IDs.
// Primary mismatch comparison: AM-applied vs Global Brand record (FW canonical).
// Secondary signal: indirect-applied vs Global Brand (means indirect was overridden).
function rowStatus(r) {
  const amClass = classifyId(r.am_industry_id);
  const gbClass = classifyId(r.gb_industry_id);
  const indClass = classifyId(r.ind_industry_id);

  // Group misuse trumps everything — anyone using a group ID is wrong
  if (amClass === 'group' || gbClass === 'group' || indClass === 'group') return 'group_misuse';

  // No AM activity at all but indirect exists
  if (amClass === 'null' && (gbClass !== 'null' || indClass !== 'null')) return 'indirect_only';
  // AM activity but nothing indirect / no global brand match
  if (amClass !== 'null' && gbClass === 'null' && indClass === 'null') return 'direct_only';

  // Primary mismatch: AM disagrees with Global Brand record
  if (r.am_industry_id != null && r.gb_industry_id != null && r.am_industry_id !== r.gb_industry_id) return 'mismatch';
  return 'aligned';
}

// Helper: indirect-vs-global-brand secondary signal
function indirectOverridden(r) {
  if (r.ind_industry_id == null || r.gb_industry_id == null) return false;
  return r.ind_industry_id !== r.gb_industry_id;
}

const fmt = {
  n: (x) => x == null ? '—' : Number(x).toLocaleString('en-US'),
  usd: (x) => x == null ? '—' : '$' + Math.round(Number(x)).toLocaleString('en-US'),
  compact: (x) => {
    if (x == null) return '—';
    const n = Number(x);
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return n.toString();
  },
};

function parseCsv(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  // Auto-detect delimiter: tab (BQ default export) or comma
  const delim = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delim).map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(delim);
    const row = {};
    headers.forEach((h, i) => {
      const raw = (vals[i] ?? '').trim().replace(/^"|"$/g, '');
      // coerce numerics
      const n = Number(raw);
      row[h] = raw === '' ? null : (raw !== '' && !isNaN(n) && n !== Infinity) ? n : raw;
    });
    return row;
  });
}

// ─── Main ────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState('mismatches');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('problems');
  const [sort, setSort] = useState({ col: 'am_revenue', dir: 'desc' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [unmapped, setUnmapped] = useState(MOCK_UNMAPPED);
  const [mismatchRaw, setMismatchRaw] = useState(MOCK_MISMATCH);
  const [dataSource, setDataSource] = useState('mock');
  const [industries, setIndustries] = useState(null);
  useEffect(() => {
    fetch('/api/industries')
      .then((r) => r.json())
      .then(setIndustries)
      .catch(() => setIndustries({ assignable: [], groupIds: [] }));
  }, []);

  // Enrich mismatch rows with computed names + status
  const mismatch = useMemo(() => mismatchRaw.map(r => ({
    ...r,
    am_industry_nm: industryName(r.am_industry_id),
    gb_industry_nm: industryName(r.gb_industry_id),
    ind_industry_nm: industryName(r.ind_industry_id),
    am_id_class: classifyId(r.am_industry_id),
    gb_id_class: classifyId(r.gb_industry_id),
    ind_id_class: classifyId(r.ind_industry_id),
    status: rowStatus(r),
    indirect_overridden: indirectOverridden(r),
  })), [mismatchRaw]);

  const kpis = useMemo(() => {
    const totalUnmapped = unmapped.length;
    const revUnmapped = unmapped.reduce((s, r) => s + (Number(r.revenue) || 0), 0);
    const mismatches = mismatch.filter(r => r.status === 'mismatch');
    const groupMisuse = mismatch.filter(r => r.status === 'group_misuse');
    const orphans = mismatch.filter(r => r.status === 'indirect_only' || r.status === 'direct_only');
    const revMismatch = mismatches.reduce((s, r) => s + (Number(r.am_revenue) || 0) + (Number(r.ind_revenue) || 0), 0);
    const revGroupMisuse = groupMisuse.reduce((s, r) => s + (Number(r.am_revenue) || 0) + (Number(r.ind_revenue) || 0), 0);
    return { totalUnmapped, revUnmapped, mismatchCount: mismatches.length, groupMisuseCount: groupMisuse.length, orphanCount: orphans.length, revMismatch, revGroupMisuse };
  }, [unmapped, mismatch]);

  const activeRows = useMemo(() => {
    let rows;
    if (tab === 'unmapped') rows = unmapped;
    else {
      rows = mismatch;
      if (statusFilter === 'problems') rows = rows.filter(r => r.status !== 'aligned');
      else if (statusFilter === 'mismatch') rows = rows.filter(r => r.status === 'mismatch');
      else if (statusFilter === 'group_misuse') rows = rows.filter(r => r.status === 'group_misuse');
    }
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => v != null && v.toString().toLowerCase().includes(s)));
    }
    rows = [...rows].sort((a, b) => {
      const av = a[sort.col], bv = b[sort.col];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number') return sort.dir === 'desc' ? bv - av : av - bv;
      return sort.dir === 'desc' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
    return rows;
  }, [tab, search, statusFilter, sort, unmapped, mismatch]);

  const toggleSort = (col) => setSort(p => p.col === col ? { col, dir: p.dir === 'desc' ? 'asc' : 'desc' } : { col, dir: 'desc' });
  const SortIcon = ({ col }) => sort.col !== col ? <ArrowUpDown className="w-3 h-3 opacity-40" /> : sort.dir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />;

  const handlePaste = (kind, text) => {
    try {
      const parsed = parseCsv(text);
      if (!parsed || parsed.length === 0) return alert('No rows parsed.');
      if (kind === 'unmapped') setUnmapped(parsed);
      else setMismatchRaw(parsed);
      setDataSource('bq');
    } catch (e) {
      alert('Parse error: ' + e.message);
    }
  };

  const resetToMock = () => {
    setUnmapped(MOCK_UNMAPPED);
    setMismatchRaw(MOCK_MISMATCH);
    setDataSource('mock');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui" }}>
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 tracking-wider uppercase mb-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                Paramount · Global Digital Ad Ops
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Advertiser · Brand · Industry Integrity</h1>
              <p className="text-sm text-slate-500 mt-1">
                Brand-level monitoring · Validated against FreeWheel canonical taxonomy
                <span className="ml-2 text-xs text-slate-400">({FW_INDUSTRIES.length.toLocaleString()} industries · {FW_GROUPS.length} groups)</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${dataSource === 'bq' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dataSource === 'bq' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                {dataSource === 'bq' ? 'Live · BigQuery' : 'Mock data'}
              </span>
              <button onClick={() => setBrowserOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
                <BookOpen className="w-3.5 h-3.5" /> Industry Browser
              </button>
              <button onClick={() => setDrawerOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800">
                <Database className="w-3.5 h-3.5" /> Load BQ Data
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Kpi label="Unmapped AM" value={fmt.n(kpis.totalUnmapped)} sub={fmt.usd(kpis.revUnmapped) + ' exposed'} tone="warn" icon={<XCircle className="w-4 h-4" />} onClick={() => setTab('unmapped')} />
          <Kpi label="Industry mismatches" value={fmt.n(kpis.mismatchCount)} sub={fmt.usd(kpis.revMismatch) + ' misattributed'} tone="alert" icon={<AlertTriangle className="w-4 h-4" />} onClick={() => { setTab('mismatches'); setStatusFilter('mismatch'); }} />
          <Kpi label="Group misuse" value={fmt.n(kpis.groupMisuseCount)} sub={fmt.usd(kpis.revGroupMisuse) + ' on group IDs'} tone="alert" icon={<Layers className="w-4 h-4" />} onClick={() => { setTab('mismatches'); setStatusFilter('group_misuse'); }} />
          <Kpi label="Indirect-only" value={fmt.n(kpis.orphanCount)} sub="No AM record" tone="info" icon={<AlertCircle className="w-4 h-4" />} onClick={() => setTab('mismatches')} />
          <Kpi label="Window" value="4/20 – 4/22" sub="3 days · US · demand_portfolio_hourly_fct" tone="neutral" icon={<Building2 className="w-4 h-4" />} />
        </div>

        <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
          <TabBtn active={tab === 'mismatches'} onClick={() => setTab('mismatches')} count={mismatch.filter(r => r.status !== 'aligned').length}>Brand Industry Issues</TabBtn>
          <TabBtn active={tab === 'unmapped'} onClick={() => setTab('unmapped')} count={unmapped.length}>Unmapped AM Entries</TabBtn>
          <TabBtn active={tab === 'optimizer'} onClick={() => setTab('optimizer')}>Separation Risk</TabBtn>
        </div>

        {tab !== 'optimizer' && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={tab === 'unmapped' ? 'Search advertiser, brand, placement ID, order ID…' : 'Search brand, industry…'}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              {tab === 'mismatches' && (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5">
                  {[['problems', 'All problems'], ['mismatch', 'Mismatch'], ['group_misuse', 'Group misuse'], ['all', 'Including aligned']].map(([k, l]) => (
                    <button key={k} onClick={() => setStatusFilter(k)}
                      className={`px-3 py-1 text-xs font-medium rounded ${statusFilter === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              {tab === 'unmapped'
                ? <UnmappedTable rows={activeRows} toggleSort={toggleSort} SortIcon={SortIcon} />
                : <MismatchTable rows={activeRows} toggleSort={toggleSort} SortIcon={SortIcon} onIndustryClick={() => setBrowserOpen(true)} />}
            </div>
          </>
        )}

        {tab === 'optimizer' && <OptimizerView mismatch={mismatch} onIndustryClick={() => setBrowserOpen(true)} />}

        <div className="mt-4 text-xs text-slate-400 leading-relaxed">
          Source: <code className="font-mono">i-digital-adsales-prod.fw_datafeed_fact_vw.demand_portfolio_hourly_fct</code><br/>
          Direct Sold (ch 2) = Advertiser Module · Programmatic/PMP/Exchange (ch 4,5,6) = Indirect · Window: 4/20–4/22 US<br/>
          Industry validation against canonical FreeWheel taxonomy (parsed from Streaming Hub User Guide, Apr 2026)
        </div>
      </main>

      {drawerOpen && <DataDrawer onClose={() => setDrawerOpen(false)} onPaste={handlePaste} onReset={resetToMock} />}
      {browserOpen && <IndustryBrowser onClose={() => setBrowserOpen(false)} />}
    </div>
  );
}

function Kpi({ label, value, sub, tone = 'neutral', icon, onClick }) {
  const toneMap = { neutral: 'bg-white border-slate-200', warn: 'bg-amber-50/40 border-amber-200', alert: 'bg-red-50/40 border-red-200', info: 'bg-blue-50/40 border-blue-200' };
  const iconMap = { neutral: 'text-slate-400 bg-slate-100', warn: 'text-amber-700 bg-amber-100', alert: 'text-red-700 bg-red-100', info: 'text-blue-700 bg-blue-100' };
  return (
    <button onClick={onClick} className={`text-left p-4 rounded-lg border transition ${toneMap[tone]} ${onClick ? 'hover:shadow-sm hover:border-slate-300 cursor-pointer' : 'cursor-default'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={`w-6 h-6 rounded flex items-center justify-center ${iconMap[tone]}`}>{icon}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-xs text-slate-500 mt-1.5">{sub}</div>
    </button>
  );
}

function TabBtn({ active, onClick, children, count }) {
  return (
    <button onClick={onClick} className={`relative px-4 py-2.5 text-sm font-medium transition ${active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
      <span className="inline-flex items-center gap-2">
        {children}
        {count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>{count}</span>}
      </span>
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>}
    </button>
  );
}

function Th({ children, col, toggleSort, SortIcon, align = 'left', width }) {
  return (
    <th style={{ width }} className={`text-${align} text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5 border-b border-slate-200 bg-slate-50/60`}>
      <button onClick={() => toggleSort(col)} className="inline-flex items-center gap-1.5 hover:text-slate-900">
        {children}
        <SortIcon col={col} />
      </button>
    </th>
  );
}

function UnmappedTable({ rows, toggleSort, SortIcon }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          <Th col="event_dt"           toggleSort={toggleSort} SortIcon={SortIcon} width="95px">Date</Th>
          <Th col="gap_type"           toggleSort={toggleSort} SortIcon={SortIcon}>Gap</Th>
          <Th col="fw_advertiser_nm"   toggleSort={toggleSort} SortIcon={SortIcon}>FW Advertiser</Th>
          <Th col="fw_brand_nm"        toggleSort={toggleSort} SortIcon={SortIcon}>FW Brand</Th>
          <Th col="placement_id"       toggleSort={toggleSort} SortIcon={SortIcon}>Placement ID</Th>
          <Th col="insertion_order_id" toggleSort={toggleSort} SortIcon={SortIcon}>Order ID</Th>
          <Th col="impressions"        toggleSort={toggleSort} SortIcon={SortIcon} align="right">Imps</Th>
          <Th col="revenue"            toggleSort={toggleSort} SortIcon={SortIcon} align="right">Revenue</Th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={8} className="text-center text-sm text-slate-400 py-12">No unmapped entries.</td></tr>
        )}
        {rows.map((r, i) => {
          const severity = r.gap_type && r.gap_type.includes('+') ? 'high' : 'med';
          const badgeTone = severity === 'high'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-amber-50 text-amber-800 border-amber-200';
          return (
            <tr key={`${r.placement_id}-${i}`} className="border-b border-slate-100 hover:bg-slate-50/60 transition">
              <td className="px-3 py-3 font-mono text-slate-500 tabular-nums text-xs whitespace-nowrap">{r.event_dt}</td>
              <td className="px-3 py-3">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap ${badgeTone}`}>
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {r.gap_type}
                </span>
              </td>
              <td className="px-3 py-3 font-medium text-slate-800">
                {r.fw_advertiser_nm || <span className="text-slate-400 italic text-xs font-normal">—</span>}
              </td>
              <td className="px-3 py-3 text-slate-700">
                {r.fw_brand_nm || <span className="text-slate-400 italic text-xs">—</span>}
              </td>
              <td className="px-3 py-3 font-mono text-xs text-slate-700 tabular-nums">
                {r.placement_id ?? <span className="text-slate-400">—</span>}
              </td>
              <td className="px-3 py-3 font-mono text-xs text-slate-700 tabular-nums">
                {r.insertion_order_id ?? <span className="text-slate-400">—</span>}
              </td>
              <td className="px-3 py-3 text-right text-slate-700 tabular-nums whitespace-nowrap">{fmt.compact(r.impressions)}</td>
              <td className="px-3 py-3 text-right font-medium text-slate-900 tabular-nums whitespace-nowrap">{fmt.usd(r.revenue)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Taxonomy hierarchy helpers (for Optimizer) ──────────────
// Pre-compute parent/child relationships across the canonical taxonomy.
// An industry's parent_path = name segment(s) before the last " > "; its root = first segment.
const TAXONOMY_DETAIL = (() => {
  const byName = new Map(FW_INDUSTRIES.map(([id, name, depth]) => [name, { id, name, depth }]));
  const childrenByParentName = new Map();
  for (const [id, name, depth] of FW_INDUSTRIES) {
    if (depth === 0) continue;
    const parts = name.split(' > ');
    const parentName = parts.slice(0, -1).join(' > ');
    if (!childrenByParentName.has(parentName)) childrenByParentName.set(parentName, []);
    childrenByParentName.get(parentName).push(id);
  }
  // For each industry, compute: descendant_ids (all children + grandchildren)
  const detail = new Map();
  for (const [id, name, depth] of FW_INDUSTRIES) {
    const descendants = [];
    const stack = [name];
    while (stack.length) {
      const cur = stack.pop();
      const kids = childrenByParentName.get(cur) || [];
      for (const kidId of kids) {
        descendants.push(kidId);
        const kidEntry = FW_INDUSTRIES.find(e => e[0] === kidId);
        if (kidEntry) stack.push(kidEntry[1]);
      }
    }
    detail.set(id, { id, name, depth, descendant_ids: descendants, has_children: descendants.length > 0 });
  }
  return detail;
})();

function getTaxDetail(id) { return TAXONOMY_DETAIL.get(id); }

function MismatchTable({ rows, toggleSort, SortIcon, onIndustryClick }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <Th col="global_brand_id" toggleSort={toggleSort} SortIcon={SortIcon} width="100px">Brand ID</Th>
          <Th col="global_brand_nm" toggleSort={toggleSort} SortIcon={SortIcon}>Brand</Th>
          <Th col="am_industry_nm" toggleSort={toggleSort} SortIcon={SortIcon}>AM Industry <span className="text-slate-400 font-normal normal-case">(applied)</span></Th>
          <Th col="gb_industry_nm" toggleSort={toggleSort} SortIcon={SortIcon}>Global Brand Industry <span className="text-slate-400 font-normal normal-case">(FW canonical)</span></Th>
          <Th col="ind_industry_nm" toggleSort={toggleSort} SortIcon={SortIcon}>Indirect Applied <span className="text-slate-400 font-normal normal-case">(PG/MP)</span></Th>
          <Th col="am_revenue" toggleSort={toggleSort} SortIcon={SortIcon} align="right">AM Rev</Th>
          <Th col="ind_revenue" toggleSort={toggleSort} SortIcon={SortIcon} align="right">Ind Rev</Th>
          <Th col="status" toggleSort={toggleSort} SortIcon={SortIcon}>Status</Th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={8} className="text-center text-sm text-slate-400 py-12">No issues in current filter.</td></tr>}
        {rows.map((r, i) => {
          const rowTone =
            r.status === 'group_misuse' ? 'bg-orange-50/40' :
            r.status === 'mismatch' ? 'bg-red-50/30' :
            (r.status === 'indirect_only' || r.status === 'direct_only') ? 'bg-blue-50/30' : '';
          return (
            <tr key={`${r.global_brand_id}-${i}`} className={`border-b border-slate-100 hover:bg-slate-50/60 transition ${rowTone}`}>
              <td className="px-4 py-3 text-sm font-mono text-slate-500 tabular-nums">{r.global_brand_id}</td>
              <td className="px-4 py-3 text-sm font-medium text-slate-900">{r.global_brand_nm}</td>
              <td className="px-3 py-3"><IndustryChip id={r.am_industry_id} name={r.am_industry_nm} klass={r.am_id_class} onClick={onIndustryClick} highlight={r.status === 'mismatch'} /></td>
              <td className="px-3 py-3"><IndustryChip id={r.gb_industry_id} name={r.gb_industry_nm} klass={r.gb_id_class} onClick={onIndustryClick} highlight={r.status === 'mismatch'} canonical /></td>
              <td className="px-3 py-3">
                <IndustryChip id={r.ind_industry_id} name={r.ind_industry_nm} klass={r.ind_id_class} onClick={onIndustryClick} />
                {r.indirect_overridden && r.status !== 'indirect_only' && (
                  <div className="text-[10px] text-amber-700 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> overridden vs global
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-right text-slate-900 tabular-nums">{fmt.usd(r.am_revenue)}</td>
              <td className="px-4 py-3 text-sm text-right text-slate-900 tabular-nums">{fmt.usd(r.ind_revenue)}</td>
              <td className="px-4 py-3"><StatusPill status={r.status} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Separation Risk ─────────────────────────────────────────
// Separation runs hierarchically: tagging at a parent industry blocks every child
// and grandchild from co-running in a break. So:
//   - Parent-level tags OVER-BLOCK (lock out inventory unnecessarily)
//   - Grandchild-level tags appropriately separate competitive sets
//
// This view surfaces three failure modes that defeat or distort separation:
//   1. Over-blocking parents — brands tagged at depth 0 when subtree exists.
//      Symptom: missed fill (e.g., the Housekeeping alert you already have).
//   2. Inconsistent depth within a subtree — peer brands tagged at different
//      depths in the same industry tree, so they slip past separation.
//   3. Cross-subtree split — same brand with creatives tagged in different
//      industry subtrees entirely, so the same advertiser can run twice
//      in one break.
//
// AM disagreeing with Global Brand is the input signal — but per Jarred,
// either side can be the correct one. The view shows the disagreement
// and lets the operator decide; it does NOT pick a winner.
function OptimizerView({ mismatch, onIndustryClick }) {
  const findings = useMemo(() => buildSeparationFindings(mismatch), [mismatch]);
  const [filterKind, setFilterKind] = useState('all');

  const visible = useMemo(() => {
    if (filterKind === 'all') return findings;
    return findings.filter(f => f.kind === filterKind);
  }, [findings, filterKind]);

  const counts = useMemo(() => {
    const c = { over_block: 0, depth_inconsistency: 0, cross_subtree: 0 };
    findings.forEach(f => { c[f.kind] = (c[f.kind] || 0) + 1; });
    return c;
  }, [findings]);

  const totalRevAtRisk = findings.reduce((s, f) => s + (f.revenue || 0), 0);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900">Separation Risk</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Separation is hierarchical — a parent-level tag blocks every child &amp; grandchild from co-running.
              This view surfaces brand assignments that break separation either by over-blocking (missed fill)
              or under-blocking (competitors collide in the same break). Each finding shows the disagreement
              between AM and the Global Brand record so you can decide which one to fix.
            </p>
            <div className="flex items-center gap-6 mt-3 text-xs">
              <div><span className="text-slate-500">Findings: </span><span className="font-semibold text-slate-900 tabular-nums">{findings.length}</span></div>
              <div><span className="text-slate-500">Revenue at risk: </span><span className="font-semibold text-slate-900 tabular-nums">{fmt.usd(totalRevAtRisk)}</span></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-4 bg-slate-50 border border-slate-200 rounded-md p-0.5 w-fit">
          {[
            ['all', `All (${findings.length})`],
            ['over_block', `Over-blocking parent (${counts.over_block || 0})`],
            ['depth_inconsistency', `Depth inconsistency (${counts.depth_inconsistency || 0})`],
            ['cross_subtree', `Cross-subtree split (${counts.cross_subtree || 0})`],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setFilterKind(k)}
              className={`px-3 py-1 text-xs font-medium rounded ${filterKind === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-sm text-slate-400">
          No separation risk findings in current data.
        </div>
      )}

      {visible.map((f, i) => <FindingCard key={i} f={f} onIndustryClick={onIndustryClick} />)}
    </div>
  );
}

// Compute findings from the brand-level mismatch dataset
function buildSeparationFindings(mismatchRows) {
  const findings = [];

  // Skip rows where AM is missing entirely (orphans handled in Issues tab)
  const eligible = mismatchRows.filter(r => r.am_industry_id != null || r.gb_industry_id != null);

  // Pre-aggregate brands per parent-root subtree for peer-depth analysis
  // For each row, look up taxonomy detail and the root parent name.
  const enriched = eligible.map(r => {
    const am = r.am_industry_id != null ? getTaxDetail(r.am_industry_id) : null;
    const gb = r.gb_industry_id != null ? getTaxDetail(r.gb_industry_id) : null;
    return { ...r, am_tax: am, gb_tax: gb };
  });

  // ─── Finding 1: Over-blocking parent ────────────────────────
  // A brand is tagged at depth 0 in either AM or GB, AND that industry has descendants.
  // Tagging at the parent over-blocks; a grandchild tag would still separate competitors
  // but allow other subcategories to fill the break.
  for (const r of enriched) {
    const tag = r.am_tax;  // focus on AM-applied first since that's what your team controls
    if (!tag || tag.depth !== 0 || !tag.has_children) continue;

    // Skip if it's a simple parent with very few children (low payoff to refactor)
    const grandchildren = tag.descendant_ids.filter(id => getTaxDetail(id)?.depth === 2);
    const childCount = tag.descendant_ids.filter(id => getTaxDetail(id)?.depth === 1).length;

    findings.push({
      kind: 'over_block',
      brand_id: r.global_brand_id,
      brand_nm: r.global_brand_nm,
      global_brand_nm: r.global_brand_nm,
      pmnt_advertiser_nm: r.pmnt_advertiser_nm,
      pmnt_brand_nm: r.pmnt_brand_nm,
      global_advertiser_nm: r.global_advertiser_nm,
      am_industry_id: r.am_industry_id,
      am_industry_nm: r.am_industry_nm,
      gb_industry_id: r.gb_industry_id,
      gb_industry_nm: r.gb_industry_nm,
      revenue: (r.am_revenue || 0) + (r.ind_revenue || 0),
      impressions: (r.am_impressions || 0) + (r.ind_impressions || 0),
      child_count: childCount,
      grandchild_count: grandchildren.length,
      candidates: tag.descendant_ids
        .map(id => getTaxDetail(id))
        .filter(Boolean)
        .sort((a, b) => b.depth - a.depth || a.name.localeCompare(b.name))
        .slice(0, 14),
      severity: (r.am_revenue || 0) >= 100000 || tag.descendant_ids.length >= 10 ? 'high' : 'med',
      rationale: `"${tag.name}" is a parent industry with ${childCount} child${childCount !== 1 ? 'ren' : ''}${grandchildren.length ? ` and ${grandchildren.length} grandchildren` : ''}. Tagging this brand at the parent blocks the entire subtree from co-running — over-blocking.`,
    });
  }

  // ─── Finding 2: Depth inconsistency within a subtree ────────
  // Compare AM-applied vs Global Brand. If both resolve to the same root parent
  // but at different depths, separation behaves inconsistently across modules
  // (one side over-blocks, the other doesn't).
  for (const r of enriched) {
    if (!r.am_tax || !r.gb_tax) continue;
    if (r.am_industry_id === r.gb_industry_id) continue;

    const amRoot = r.am_tax.name.split(' > ')[0];
    const gbRoot = r.gb_tax.name.split(' > ')[0];

    // Same subtree, different depth = depth inconsistency
    if (amRoot === gbRoot && r.am_tax.depth !== r.gb_tax.depth) {
      const deeper = r.am_tax.depth > r.gb_tax.depth ? 'AM' : 'GB';
      findings.push({
        kind: 'depth_inconsistency',
        brand_id: r.global_brand_id,
        brand_nm: r.global_brand_nm,
        global_brand_nm: r.global_brand_nm,
        pmnt_advertiser_nm: r.pmnt_advertiser_nm,
        pmnt_brand_nm: r.pmnt_brand_nm,
        global_advertiser_nm: r.global_advertiser_nm,
        am_industry_id: r.am_industry_id,
        am_industry_nm: r.am_industry_nm,
        am_depth: r.am_tax.depth,
        gb_industry_id: r.gb_industry_id,
        gb_industry_nm: r.gb_industry_nm,
        gb_depth: r.gb_tax.depth,
        shared_root: amRoot,
        deeper_side: deeper,
        revenue: (r.am_revenue || 0) + (r.ind_revenue || 0),
        impressions: (r.am_impressions || 0) + (r.ind_impressions || 0),
        severity: 'med',
        rationale: `Both AM and Global Brand place this in the "${amRoot}" subtree, but at different depths. The shallower side will block more inventory than the deeper side, so separation behavior depends on which module controls the break.`,
      });
    }
  }

  // ─── Finding 3: Cross-subtree split ─────────────────────────
  // AM and GB resolve to entirely different root parents — same brand,
  // two different industry families. Means the same advertiser can run twice
  // in one break (separated by neither family's filter).
  for (const r of enriched) {
    if (!r.am_tax || !r.gb_tax) continue;
    if (r.am_industry_id === r.gb_industry_id) continue;

    const amRoot = r.am_tax.name.split(' > ')[0];
    const gbRoot = r.gb_tax.name.split(' > ')[0];
    if (amRoot === gbRoot) continue;  // handled above

    findings.push({
      kind: 'cross_subtree',
      brand_id: r.global_brand_id,
      brand_nm: r.global_brand_nm,
      global_brand_nm: r.global_brand_nm,
      pmnt_advertiser_nm: r.pmnt_advertiser_nm,
      pmnt_brand_nm: r.pmnt_brand_nm,
      global_advertiser_nm: r.global_advertiser_nm,
      am_industry_id: r.am_industry_id,
      am_industry_nm: r.am_industry_nm,
      am_root: amRoot,
      gb_industry_id: r.gb_industry_id,
      gb_industry_nm: r.gb_industry_nm,
      gb_root: gbRoot,
      revenue: (r.am_revenue || 0) + (r.ind_revenue || 0),
      impressions: (r.am_impressions || 0) + (r.ind_impressions || 0),
      severity: 'high',
      rationale: `AM and Global Brand assign this brand to entirely different industry families — "${amRoot}" vs "${gbRoot}". A break that filters one family will not filter the other, so this advertiser can appear twice in one pod.`,
    });
  }

  // Sort: cross_subtree (most dangerous) → over_block (revenue-weighted) → depth_inconsistency
  return findings.sort((a, b) => {
    const order = { cross_subtree: 0, over_block: 1, depth_inconsistency: 2 };
    if (order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind];
    return (b.revenue || 0) - (a.revenue || 0);
  });
}

function FindingCard({ f, onIndustryClick }) {
  const sevColor = f.severity === 'high' ? 'red' : f.severity === 'med' ? 'amber' : 'slate';
  const kindMeta = {
    over_block: { label: 'Over-blocking parent', icon: <Layers className="w-4 h-4" /> },
    depth_inconsistency: { label: 'Depth inconsistency', icon: <ArrowUpDown className="w-4 h-4" /> },
    cross_subtree: { label: 'Cross-subtree split', icon: <AlertTriangle className="w-4 h-4" /> },
  }[f.kind];

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${
      sevColor === 'red' ? 'border-red-200' :
      sevColor === 'amber' ? 'border-amber-200' :
      'border-slate-200'
    }`}>
      <div className={`px-5 py-3 border-b flex items-center justify-between ${
        sevColor === 'red' ? 'bg-red-50/50 border-red-200' :
        sevColor === 'amber' ? 'bg-amber-50/50 border-amber-200' :
        'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`${sevColor === 'red' ? 'text-red-600' : sevColor === 'amber' ? 'text-amber-600' : 'text-slate-500'}`}>
            {kindMeta.icon}
          </span>
          <span className={`text-[10px] uppercase tracking-wider font-bold ${
            sevColor === 'red' ? 'text-red-700' :
            sevColor === 'amber' ? 'text-amber-700' :
            'text-slate-600'
          }`}>
            {kindMeta.label} · {f.severity.toUpperCase()}
          </span>
          <span className="text-sm font-semibold text-slate-900">{f.brand_nm}</span>
          <span className="text-xs font-mono text-slate-500">brand {f.brand_id}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600 tabular-nums">
          <span><strong className="text-slate-900">{fmt.usd(f.revenue)}</strong> rev</span>
          <span>{fmt.compact(f.impressions)} imps</span>
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="text-sm text-slate-700 mb-3 leading-relaxed">{f.rationale}</p>

        {/* Disagreement panel — show full Paramount vs FW global identity (advertiser, brand, industry) */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="border border-slate-200 rounded-md p-3 bg-slate-50/40 space-y-2">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Paramount-tagged (AM)</div>
            <IdentityRow label="Advertiser" value={f.pmnt_advertiser_nm} />
            <IdentityRow label="Brand" value={f.pmnt_brand_nm} />
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase mb-1">Industry</div>
              {f.am_industry_id != null
                ? <IndustryChip id={f.am_industry_id} name={f.am_industry_nm} klass={classifyId(f.am_industry_id)} onClick={onIndustryClick} />
                : <span className="text-xs text-slate-400 italic">No AM tag</span>
              }
              {f.am_depth != null && (
                <div className="text-[11px] text-slate-500 mt-1">depth {f.am_depth}{f.deeper_side === 'AM' ? ' · deeper' : ' · shallower (over-blocks)'}</div>
              )}
            </div>
          </div>
          <div className="border border-emerald-200 rounded-md p-3 bg-emerald-50/30 space-y-2">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">FreeWheel canonical (Global)</div>
            <IdentityRow label="Advertiser" value={f.global_advertiser_nm} canonical />
            <IdentityRow label="Brand" value={f.global_brand_nm} canonical />
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase mb-1">Industry</div>
              {f.gb_industry_id != null
                ? <IndustryChip id={f.gb_industry_id} name={f.gb_industry_nm} klass={classifyId(f.gb_industry_id)} onClick={onIndustryClick} canonical />
                : <span className="text-xs text-slate-400 italic">No GB tag</span>
              }
              {f.gb_depth != null && (
                <div className="text-[11px] text-slate-500 mt-1">depth {f.gb_depth}{f.deeper_side === 'GB' ? ' · deeper' : ' · shallower (over-blocks)'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Type-specific recommendation panel */}
        {f.kind === 'over_block' && f.candidates && f.candidates.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Available granular tags within this subtree ({f.child_count} children · {f.grandchild_count} grandchildren)
            </div>
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
              {f.candidates.map(c => (
                <button key={c.id} onClick={onIndustryClick} className="flex items-center gap-2 text-xs px-2 py-1.5 bg-emerald-50/60 hover:bg-emerald-100/60 rounded border border-emerald-200 transition text-left">
                  <span className="font-mono text-slate-500 tabular-nums w-12">{c.id}</span>
                  <span className="text-slate-400 w-4">{c.depth === 2 ? '↳↳' : '↳'}</span>
                  <span className="font-medium text-slate-800 truncate flex-1">{c.name.split(' > ').slice(-1)[0]}</span>
                  {c.depth === 2 && <span className="text-[9px] uppercase font-bold text-emerald-700">leaf</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {f.kind === 'cross_subtree' && (
          <div className="text-xs px-3 py-2.5 bg-red-50/60 rounded border border-red-200 text-red-900 leading-relaxed">
            <strong>Decide which family this brand belongs to.</strong> Until both modules agree on the same subtree, separation will not catch this advertiser running back-to-back in a single break. Per your team's case-by-case rule, neither side is automatically "right" — review with the AM team.
          </div>
        )}

        {f.kind === 'depth_inconsistency' && (
          <div className="text-xs px-3 py-2.5 bg-amber-50/60 rounded border border-amber-200 text-amber-900 leading-relaxed">
            <strong>Align both sides to the same depth.</strong> The shallower tag over-blocks the entire subtree (e.g., your existing Housekeeping alert). The deeper tag separates only that grandchild. Pick one based on how this brand should compete — and apply it on both AM and the Global Brand record.
          </div>
        )}
      </div>
    </div>
  );
}

function IdentityRow({ label, value, canonical }) {
  const isMissing = value == null || value === '';
  return (
    <div>
      <div className="text-[10px] font-medium text-slate-400 uppercase mb-0.5">{label}</div>
      <div className={`text-sm leading-tight ${
        isMissing ? 'text-slate-400 italic' :
        canonical ? 'text-slate-900 font-medium' :
        'text-slate-800'
      }`}>
        {isMissing ? '—' : value}
      </div>
    </div>
  );
}

function IndustryChip({ id, name, klass, onClick, highlight, canonical }) {
  if (id == null) return <span className="text-xs text-slate-400 italic">No record</span>;

  const isGroup = klass === 'group';
  const isUnknown = klass === 'unknown';
  const wrap = isGroup
    ? 'border-orange-300 bg-orange-50 text-orange-800'
    : isUnknown
      ? 'border-slate-300 bg-slate-100 text-slate-600'
      : highlight
        ? 'border-red-300 bg-red-50 text-red-900'
        : canonical
          ? 'border-emerald-200 bg-emerald-50/40 text-slate-800'
          : 'border-slate-200 bg-white text-slate-700';

  return (
    <button onClick={onClick} className={`inline-flex flex-col items-start gap-0.5 text-left px-2 py-1 rounded border ${wrap} hover:shadow-sm transition max-w-[260px]`}>
      <div className="flex items-center gap-1.5">
        {isGroup && <Layers className="w-3 h-3 text-orange-600 flex-shrink-0" />}
        <span className="text-[10px] font-mono text-slate-500">{id}</span>
        {isGroup && <span className="text-[9px] uppercase tracking-wider font-bold text-orange-700">GROUP</span>}
        {isUnknown && <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">UNKNOWN</span>}
        {canonical && !isGroup && !isUnknown && <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-700">CANONICAL</span>}
      </div>
      <span className="text-xs font-medium leading-tight line-clamp-2">{name}</span>
    </button>
  );
}

function StatusPill({ status }) {
  const cfg = {
    mismatch: ['bg-red-100 text-red-700', 'Mismatch'],
    group_misuse: ['bg-orange-100 text-orange-800', 'Group misuse'],
    aligned: ['bg-emerald-100 text-emerald-700', 'Aligned'],
    indirect_only: ['bg-blue-100 text-blue-700', 'Indirect-only'],
    direct_only: ['bg-slate-100 text-slate-700', 'Direct-only'],
  }[status] || ['bg-slate-100 text-slate-700', status || '—'];
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${cfg[0]}`}>{cfg[1]}</span>;
}

// ─── Industry Browser ────────────────────────────────────────
function IndustryBrowser({ onClose }) {
  const [search, setSearch] = useState('');
  const [showGroups, setShowGroups] = useState(false);
  const [depthFilter, setDepthFilter] = useState('all');

  const filtered = useMemo(() => {
    const source = showGroups
      ? FW_GROUPS.map(([id, name]) => ({ id, name, depth: 0, kind: 'group' }))
      : FW_INDUSTRIES.map(([id, name, depth]) => ({ id, name, depth, kind: 'industry' }));

    let rows = source;
    if (!showGroups && depthFilter !== 'all') {
      const d = parseInt(depthFilter, 10);
      rows = rows.filter(r => r.depth === d);
    }
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r => r.name.toLowerCase().includes(s) || String(r.id).includes(s));
    }
    return rows.slice(0, 500);
  }, [search, showGroups, depthFilter]);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/30" onClick={onClose}>
      <div className="w-[680px] bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-600" />
            <h2 className="text-base font-semibold">FreeWheel Industry Taxonomy</h2>
            <span className="text-xs text-slate-500">canonical reference</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-3 border-b border-slate-200 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or ID…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md p-0.5">
              <button onClick={() => setShowGroups(false)} className={`px-3 py-1 text-xs font-medium rounded ${!showGroups ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>
                Industries ({FW_INDUSTRIES.length.toLocaleString()})
              </button>
              <button onClick={() => setShowGroups(true)} className={`px-3 py-1 text-xs font-medium rounded ${showGroups ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>
                Groups ({FW_GROUPS.length})
              </button>
            </div>
            {!showGroups && (
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md p-0.5">
                {[['all', 'All depths'], ['0', 'Parent'], ['1', 'Child'], ['2', 'Grandchild']].map(([k, l]) => (
                  <button key={k} onClick={() => setDepthFilter(k)}
                    className={`px-2.5 py-1 text-xs font-medium rounded ${depthFilter === k ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map(r => (
            <div key={`${r.kind}-${r.id}`} className="flex items-start gap-3 px-6 py-2 hover:bg-slate-50 border-b border-slate-100">
              <span className="font-mono text-xs text-slate-500 w-14 flex-shrink-0 pt-0.5 tabular-nums">{r.id}</span>
              <span className="text-sm text-slate-800 leading-snug flex-1">
                {r.kind === 'group' && (
                  <span className="inline-block text-[9px] uppercase tracking-wider font-bold text-orange-700 bg-orange-100 px-1 py-0.5 rounded mr-1.5 align-middle">GROUP</span>
                )}
                {r.depth === 1 && <span className="text-slate-400">↳ </span>}
                {r.depth === 2 && <span className="text-slate-400">  ↳ </span>}
                {r.name}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-sm text-slate-400 py-12">No matches.</div>
          )}
          {filtered.length === 500 && (
            <div className="text-center text-xs text-slate-400 py-3 border-t">Showing first 500 results — refine search to narrow.</div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-3 text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-700">Depth 0</strong>: parent industry (e.g., <span className="font-mono">194 Automobile Dealerships</span>) ·
          <strong className="text-slate-700"> Depth 1</strong>: child (e.g., <span className="font-mono">9316 &gt; Luxury Cars</span>) ·
          <strong className="text-slate-700"> Depth 2</strong>: grandchild.
          Always use ACTUAL industries (not groups) for brand assignment.
        </div>
      </div>
    </div>
  );
}

// ─── Data Loader Drawer ──────────────────────────────────────
function DataDrawer({ onClose, onPaste, onReset }) {
  const [unmappedCsv, setUnmappedCsv] = useState('');
  const [mismatchCsv, setMismatchCsv] = useState('');
  const [loaded, setLoaded] = useState({ unmapped: false, mismatch: false });

  const handleLoad = (kind, text) => {
    if (!text.trim()) return;
    onPaste(kind, text);
    setLoaded(prev => ({ ...prev, [kind]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/30" onClick={onClose}>
      <div className="w-[680px] bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-600" />
            <h2 className="text-base font-semibold">Load BigQuery data</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3">
            <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5"><FileCode2 className="w-3.5 h-3.5" /> How to load</div>
            Run queries in BigQuery. Copy result rows (including header). Paste below and click Load.
            Auto-detects tab or comma delimited.
          </div>
          <CsvPasteSection
            title="1. Unmapped Advertiser Module"
            filename="01_unmapped_advertiser_module.sql"
            expectedCols={['event_dt', 'gap_type', 'placement_id', 'insertion_order_id', 'fw_advertiser_nm', 'fw_brand_nm', 'impressions', 'revenue']}
            value={unmappedCsv}
            onChange={setUnmappedCsv}
            loaded={loaded.unmapped}
            onLoad={() => handleLoad('unmapped', unmappedCsv)}
          />
          <CsvPasteSection
            title="2. Brand Industry Mismatches"
            filename="02_industry_mismatch_by_brand.sql"
            expectedCols={['global_brand_id', 'global_brand_nm', 'global_advertiser_nm', 'pmnt_advertiser_nm', 'pmnt_brand_nm', 'am_industry_id', 'gb_industry_id', 'ind_industry_id', 'am_impressions', 'am_revenue', 'ind_impressions', 'ind_revenue']}
            value={mismatchCsv}
            onChange={setMismatchCsv}
            loaded={loaded.mismatch}
            onLoad={() => handleLoad('mismatch', mismatchCsv)}
          />
        </div>
        <div className="border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <button onClick={onReset} className="text-xs text-slate-500 hover:text-slate-900">Reset to mock data</button>
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800">Done</button>
        </div>
      </div>
    </div>
  );
}

function CsvPasteSection({ title, filename, expectedCols, value, onChange, onLoad, loaded }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            {title}
            {loaded && <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Loaded</span>}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Query: <code className="font-mono">{filename}</code></p>
        </div>
        <button
          onClick={onLoad}
          disabled={!value.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          <Upload className="w-3.5 h-3.5" /> Load
        </button>
      </div>
      <div className="text-[11px] text-slate-500 mb-1.5 leading-relaxed">
        Expected columns: {expectedCols.map(c => <code key={c} className="font-mono bg-slate-100 px-1 py-0.5 rounded mr-1 text-[10px]">{c}</code>)}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste BQ result rows here (with header row)…"
        className="w-full h-36 p-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y"
      />
    </div>
  );
}
