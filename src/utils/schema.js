import mongoose from "mongoose";

/* ================================================================
   COMMON VALIDATION
================================================================ */

/*
  Names:
  - Alphabets only
  - Spaces are allowed between words
  - No numbers
  - No special characters
*/
const nameRegex = /^[\p{L}]+(?:[\s]+[\p{L}]+)*$/u;

/*
  Phone:
  - Digits only
  - 7 to 15 digits
*/
const phoneRegex = /^[0-9]{7,15}$/;

/*
  Email:
  Basic email validation.
*/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
  Slug:
  lowercase letters, numbers and hyphens
*/
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/*
  URL:
  HTTP / HTTPS only
*/
const urlRegex = /^https?:\/\/[^\s]+$/i;

/*
  Supported languages.
*/
const SUPPORTED_LANGUAGES = ["Tamil", "English", "Hindi", "Malayalam"];

/*
  Supported currencies.
*/
const SUPPORTED_CURRENCIES = ["INR", "USD"];

/* ================================================================
   IMAGE SUB-SCHEMA
   Stores Cloudinary URL + public_id
================================================================ */

const ImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
      validate: {
        validator: (value) => urlRegex.test(value),
        message: "Image URL must be a valid HTTP or HTTPS URL",
      },
    },

    publicId: {
      type: String,
      required: [true, "Image public ID is required"],
      trim: true,
      minlength: [1, "Image public ID is required"],
    },
  },
  {
    _id: false,
  },
);

/* ================================================================
   ADMIN SCHEMA
================================================================ */

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
      minlength: [2, "Admin name must be at least 2 characters"],
      maxlength: [50, "Admin name cannot exceed 50 characters"],
      validate: {
        validator: (value) => nameRegex.test(value),
        message: "Admin name can contain alphabets and spaces only",
      },
    },

    email: {
      type: String,
      required: [true, "Admin email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: [150, "Admin email cannot exceed 150 characters"],
      validate: {
        validator: (value) => emailRegex.test(value),
        message: "Please enter a valid email address",
      },
    },

    password: {
      type: String,
      required: [true, "Admin password is required"],
      select: false,
    },

    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Admin status must be active or inactive",
      },
      default: "active",
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/* ================================================================
   INQUIRY SCHEMA
================================================================ */

const InquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
      validate: {
        validator: (value) => nameRegex.test(value),
        message: "Name can contain alphabets and spaces only",
      },
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      maxlength: [150, "Email cannot exceed 150 characters"],
      validate: {
        validator: (value) => emailRegex.test(value),
        message: "Please enter a valid email address",
      },
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: (value) => phoneRegex.test(value),
        message: "Phone number must contain 7 to 15 digits only",
      },
    },

    subject: {
      type: String,
      trim: true,
      maxlength: [150, "Subject cannot exceed 150 characters"],
      default: "",
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [5, "Message must be at least 5 characters"],
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },

    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      default: null,
    },

    status: {
      type: String,
      enum: {
        values: ["new", "contacted", "resolved", "archived"],
        message: "Inquiry status must be new, contacted, resolved, or archived",
      },
      default: "new",
      index: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    adminNote: {
      type: String,
      trim: true,
      maxlength: [2000, "Admin note cannot exceed 2000 characters"],
      default: "",
    },

    contactedAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/* ================================================================
   DESTINATION SCHEMA
================================================================ */

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Destination name is required"],
      trim: true,
      minlength: [2, "Destination name must be at least 2 characters"],
      maxlength: [100, "Destination name cannot exceed 100 characters"],
      validate: {
        validator: (value) => nameRegex.test(value),
        message: "Destination name can contain alphabets and spaces only",
      },
    },

    slug: {
      type: String,
      required: [true, "Destination slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [120, "Slug cannot exceed 120 characters"],
      validate: {
        validator: (value) => slugRegex.test(value),
        message:
          "Slug can contain lowercase letters, numbers, and hyphens only",
      },
    },

    type: {
      type: String,
      enum: {
        values: ["country", "state", "city", "region"],
        message: "Invalid destination type",
      },
      required: [true, "Destination type is required"],
    },

    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      minlength: [2, "Country must be at least 2 characters"],
      maxlength: [100, "Country cannot exceed 100 characters"],
    },

    state: {
      type: String,
      trim: true,
      maxlength: [100, "State cannot exceed 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },

    bestTimeToVisit: {
      type: String,
      trim: true,
      maxlength: [200, "Best time to visit cannot exceed 200 characters"],
    },

    /*
      Only:
      Tamil
      English
      Hindi
      Malayalam
    */
    language: {
      type: String,
      trim: true,
      enum: {
        values: SUPPORTED_LANGUAGES,
        message: "Language must be Tamil, English, Hindi, or Malayalam",
      },
    },

    /*
      Only:
      INR
      USD
    */
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      enum: {
        values: SUPPORTED_CURRENCIES,
        message: "Currency must be INR or USD",
      },
      default: "INR",
    },

    /* Cloudinary cover image */
    coverImage: {
      type: ImageSchema,
      required: [true, "Cover image is required"],
    },

    /* Cloudinary gallery images */
    gallery: {
      type: [ImageSchema],
      default: [],
    },

    /*
      Latitude:
      -90 to 90
    */
    latitude: {
      type: Number,
      min: [-90, "Latitude cannot be less than -90"],
      max: [90, "Latitude cannot be greater than 90"],
    },

    /*
      Longitude:
      -180 to 180
    */
    longitude: {
      type: Number,
      min: [-180, "Longitude cannot be less than -180"],
      max: [180, "Longitude cannot be greater than 180"],
    },

    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/* ================================================================
   PLACE SCHEMA
================================================================ */

const placeSchema = new mongoose.Schema(
  {
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      required: [true, "Destination is required"],
    },

    name: {
      type: String,
      required: [true, "Place name is required"],
      trim: true,
      minlength: [2, "Place name must be at least 2 characters"],
      maxlength: [150, "Place name cannot exceed 150 characters"],
      validate: {
        validator: (value) => nameRegex.test(value),
        message: "Place name can contain alphabets and spaces only",
      },
    },

    slug: {
      type: String,
      required: [true, "Place slug is required"],
      trim: true,
      lowercase: true,
      maxlength: [150, "Slug cannot exceed 150 characters"],
      validate: {
        validator: (value) => slugRegex.test(value),
        message:
          "Slug can contain lowercase letters, numbers, and hyphens only",
      },
    },

    category: {
      type: String,
      enum: {
        values: [
          "historical",
          "beach",
          "temple",
          "museum",
          "waterfall",
          "hill-station",
          "wildlife",
          "adventure",
          "park",
          "lake",
          "viewpoint",
          "other",
        ],
        message: "Invalid place category",
      },
      required: [true, "Place category is required"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },

    entryFee: {
      adult: {
        type: Number,
        min: [0, "Adult entry fee cannot be negative"],
        default: 0,
      },

      child: {
        type: Number,
        min: [0, "Child entry fee cannot be negative"],
        default: 0,
      },

      foreigner: {
        type: Number,
        min: [0, "Foreigner entry fee cannot be negative"],
        default: 0,
      },
    },

    currency: {
      type: String,
      uppercase: true,
      trim: true,
      enum: {
        values: SUPPORTED_CURRENCIES,
        message: "Currency must be INR or USD",
      },
      default: "INR",
    },

    openingTime: {
      type: String,
      trim: true,
      maxlength: [50, "Opening time cannot exceed 50 characters"],
    },

    closingTime: {
      type: String,
      trim: true,
      maxlength: [50, "Closing time cannot exceed 50 characters"],
    },

    closedOn: {
      type: String,
      trim: true,
      maxlength: [100, "Closed on cannot exceed 100 characters"],
    },

    bestTimeToVisit: {
      type: String,
      trim: true,
      maxlength: [200, "Best time to visit cannot exceed 200 characters"],
    },

    visitDuration: {
      type: String,
      trim: true,
      maxlength: [100, "Visit duration cannot exceed 100 characters"],
    },

    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },

    latitude: {
      type: Number,
      min: [-90, "Latitude cannot be less than -90"],
      max: [90, "Latitude cannot be greater than 90"],
    },

    longitude: {
      type: Number,
      min: [-180, "Longitude cannot be less than -180"],
      max: [180, "Longitude cannot be greater than 180"],
    },

    /* Cloudinary cover image */
    coverImage: {
      type: ImageSchema,
      required: [true, "Cover image is required"],
    },

    /* Cloudinary gallery */
    gallery: {
      type: [ImageSchema],
      default: [],
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/* ================================================================
   HOTEL SCHEMA
================================================================ */

const hotelSchema = new mongoose.Schema(
  {
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      required: [true, "Destination is required"],
    },

    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
      minlength: [2, "Hotel name must be at least 2 characters"],
      maxlength: [150, "Hotel name cannot exceed 150 characters"],
      validate: {
        validator: (value) => nameRegex.test(value),
        message: "Hotel name can contain alphabets and spaces only",
      },
    },

    slug: {
      type: String,
      required: [true, "Hotel slug is required"],
      lowercase: true,
      trim: true,
      maxlength: [150, "Slug cannot exceed 150 characters"],
      validate: {
        validator: (value) => slugRegex.test(value),
        message:
          "Slug can contain lowercase letters, numbers, and hyphens only",
      },
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    category: {
      type: String,
      enum: {
        values: [
          "budget",
          "standard",
          "premium",
          "luxury",
          "resort",
          "homestay",
          "hostel",
        ],
        message: "Invalid hotel category",
      },
      required: [true, "Hotel category is required"],
    },

    pricePerNight: {
      min: {
        type: Number,
        required: [true, "Minimum price per night is required"],
        min: [0, "Minimum price cannot be negative"],
      },

      max: {
        type: Number,
        required: [true, "Maximum price per night is required"],
        min: [0, "Maximum price cannot be negative"],
      },
    },

    currency: {
      type: String,
      uppercase: true,
      trim: true,
      enum: {
        values: SUPPORTED_CURRENCIES,
        message: "Currency must be INR or USD",
      },
      default: "INR",
    },

    amenities: [
      {
        type: String,
        trim: true,
        maxlength: [100, "Amenity cannot exceed 100 characters"],
      },
    ],

    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },

    latitude: {
      type: Number,
      min: [-90, "Latitude cannot be less than -90"],
      max: [90, "Latitude cannot be greater than 90"],
    },

    longitude: {
      type: Number,
      min: [-180, "Longitude cannot be less than -180"],
      max: [180, "Longitude cannot be greater than 180"],
    },

    contactPhone: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => !value || phoneRegex.test(value),
        message: "Contact phone must contain 7 to 15 digits only",
      },
    },

    website: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => !value || urlRegex.test(value),
        message: "Website must be a valid HTTP or HTTPS URL",
      },
    },

    /* Cloudinary cover image */
    coverImage: {
      type: ImageSchema,
      required: [true, "Cover image is required"],
    },

    /* Cloudinary gallery */
    gallery: {
      type: [ImageSchema],
      default: [],
    },

    rating: {
      type: Number,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot exceed 5"],
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/* ================================================================
   RESTAURANT SCHEMA
================================================================ */

const restaurantSchema = new mongoose.Schema(
  {
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      required: [true, "Destination is required"],
    },

    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
      minlength: [2, "Restaurant name must be at least 2 characters"],
      maxlength: [150, "Restaurant name cannot exceed 150 characters"],
      validate: {
        validator: (value) => nameRegex.test(value),
        message: "Restaurant name can contain alphabets and spaces only",
      },
    },

    slug: {
      type: String,
      required: [true, "Restaurant slug is required"],
      lowercase: true,
      trim: true,
      maxlength: [150, "Slug cannot exceed 150 characters"],
      validate: {
        validator: (value) => slugRegex.test(value),
        message:
          "Slug can contain lowercase letters, numbers, and hyphens only",
      },
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    cuisines: [
      {
        type: String,
        trim: true,
        maxlength: [100, "Cuisine cannot exceed 100 characters"],
      },
    ],

    foodType: {
      type: String,
      enum: {
        values: ["veg", "non-veg", "both"],
        message: "Invalid food type",
      },
      default: "both",
    },

    priceRange: {
      type: String,
      enum: {
        values: ["budget", "moderate", "expensive"],
        message: "Invalid restaurant price range",
      },
      required: [true, "Price range is required"],
    },

    popularDishes: [
      {
        type: String,
        trim: true,
        maxlength: [150, "Dish name cannot exceed 150 characters"],
      },
    ],

    openingTime: {
      type: String,
      trim: true,
      maxlength: [50, "Opening time cannot exceed 50 characters"],
    },

    closingTime: {
      type: String,
      trim: true,
      maxlength: [50, "Closing time cannot exceed 50 characters"],
    },

    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },

    latitude: {
      type: Number,
      min: [-90, "Latitude cannot be less than -90"],
      max: [90, "Latitude cannot be greater than 90"],
    },

    longitude: {
      type: Number,
      min: [-180, "Longitude cannot be less than -180"],
      max: [180, "Longitude cannot be greater than 180"],
    },

    contactPhone: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => !value || phoneRegex.test(value),
        message: "Contact phone must contain 7 to 15 digits only",
      },
    },

    website: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => !value || urlRegex.test(value),
        message: "Website must be a valid HTTP or HTTPS URL",
      },
    },

    /* Cloudinary cover image */
    coverImage: {
      type: ImageSchema,
      required: [true, "Cover image is required"],
    },

    /* Cloudinary gallery */
    gallery: {
      type: [ImageSchema],
      default: [],
    },

    rating: {
      type: Number,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot exceed 5"],
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/* ================================================================
   TRANSPORTATION SCHEMA
================================================================ */

const transportationSchema = new mongoose.Schema(
  {
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      required: [true, "Destination is required"],
    },

    type: {
      type: String,
      enum: {
        values: ["flight", "train", "bus", "taxi", "car-rental", "bike-rental"],
        message: "Invalid transportation type",
      },
      required: [true, "Transportation type is required"],
    },

    providerName: {
      type: String,
      required: [true, "Provider name is required"],
      trim: true,
      minlength: [2, "Provider name must be at least 2 characters"],
      maxlength: [150, "Provider name cannot exceed 150 characters"],
      validate: {
        validator: (value) => nameRegex.test(value),
        message: "Provider name can contain alphabets and spaces only",
      },
    },

    from: {
      type: String,
      required: [true, "Starting location is required"],
      trim: true,
      maxlength: [150, "Starting location cannot exceed 150 characters"],
    },

    to: {
      type: String,
      required: [true, "Destination location is required"],
      trim: true,
      maxlength: [150, "Destination location cannot exceed 150 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },

    estimatedCost: {
      min: {
        type: Number,
        min: [0, "Minimum estimated cost cannot be negative"],
      },

      max: {
        type: Number,
        min: [0, "Maximum estimated cost cannot be negative"],
      },
    },

    currency: {
      type: String,
      uppercase: true,
      trim: true,
      enum: {
        values: SUPPORTED_CURRENCIES,
        message: "Currency must be INR or USD",
      },
      default: "INR",
    },

    estimatedDuration: {
      type: String,
      trim: true,
      maxlength: [100, "Estimated duration cannot exceed 100 characters"],
    },

    schedule: {
      type: String,
      trim: true,
      maxlength: [500, "Schedule cannot exceed 500 characters"],
    },

    bookingUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => !value || urlRegex.test(value),
        message: "Booking URL must be a valid HTTP or HTTPS URL",
      },
    },

    contactPhone: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => !value || phoneRegex.test(value),
        message: "Contact phone must contain 7 to 15 digits only",
      },
    },

    /* Cloudinary cover image */
    coverImage: {
      type: ImageSchema,
      default: null,
    },

    /* Cloudinary gallery */
    gallery: {
      type: [ImageSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/* ================================================================
   PACKAGE SCHEMA
================================================================ */

const packageSchema = new mongoose.Schema(
  {
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      required: [true, "Destination is required"],
    },

    name: {
      type: String,
      required: [true, "Package name is required"],
      trim: true,
      minlength: [2, "Package name must be at least 2 characters"],
      maxlength: [150, "Package name cannot exceed 150 characters"],
      validate: {
        validator: (value) => nameRegex.test(value),
        message: "Package name can contain alphabets and spaces only",
      },
    },

    slug: {
      type: String,
      required: [true, "Package slug is required"],
      lowercase: true,
      trim: true,
      maxlength: [150, "Slug cannot exceed 150 characters"],
      validate: {
        validator: (value) => slugRegex.test(value),
        message:
          "Slug can contain lowercase letters, numbers, and hyphens only",
      },
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    duration: {
      days: {
        type: Number,
        required: [true, "Package days are required"],
        min: [1, "Package must have at least 1 day"],
        validate: {
          validator: Number.isInteger,
          message: "Package days must be a whole number",
        },
      },

      nights: {
        type: Number,
        required: [true, "Package nights are required"],
        min: [0, "Package nights cannot be negative"],
        validate: {
          validator: Number.isInteger,
          message: "Package nights must be a whole number",
        },
      },
    },

    price: {
      type: Number,
      required: [true, "Package price is required"],
      min: [0, "Package price cannot be negative"],
    },

    currency: {
      type: String,
      uppercase: true,
      trim: true,
      enum: {
        values: SUPPORTED_CURRENCIES,
        message: "Currency must be INR or USD",
      },
      default: "INR",
    },

    priceType: {
      type: String,
      enum: {
        values: ["per-person", "per-couple", "per-group"],
        message: "Invalid package price type",
      },
      default: "per-person",
    },

    inclusions: [
      {
        type: String,
        trim: true,
        maxlength: [300, "Inclusion cannot exceed 300 characters"],
      },
    ],

    exclusions: [
      {
        type: String,
        trim: true,
        maxlength: [300, "Exclusion cannot exceed 300 characters"],
      },
    ],

    itinerary: [
      {
        day: {
          type: Number,
          required: [true, "Itinerary day is required"],
          min: [1, "Itinerary day must be at least 1"],
          validate: {
            validator: Number.isInteger,
            message: "Itinerary day must be a whole number",
          },
        },

        title: {
          type: String,
          required: [true, "Itinerary title is required"],
          trim: true,
          maxlength: [200, "Itinerary title cannot exceed 200 characters"],
        },

        description: {
          type: String,
          trim: true,
          maxlength: [
            2000,
            "Itinerary description cannot exceed 2000 characters",
          ],
        },

        places: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Place",
          },
        ],
      },
    ],

    /* Cloudinary cover image */
    coverImage: {
      type: ImageSchema,
      required: [true, "Cover image is required"],
    },

    /* Cloudinary gallery */
    gallery: {
      type: [ImageSchema],
      default: [],
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/* ================================================================
   ITINERARY SCHEMA
================================================================ */

const itinerarySchema = new mongoose.Schema(
  {
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      required: [true, "Destination is required"],
    },

    title: {
      type: String,
      required: [true, "Itinerary title is required"],
      trim: true,
      minlength: [2, "Itinerary title must be at least 2 characters"],
      maxlength: [200, "Itinerary title cannot exceed 200 characters"],
      validate: {
        validator: (value) => nameRegex.test(value),
        message: "Itinerary title can contain alphabets and spaces only",
      },
    },

    slug: {
      type: String,
      required: [true, "Itinerary slug is required"],
      lowercase: true,
      trim: true,
      maxlength: [200, "Slug cannot exceed 200 characters"],
      validate: {
        validator: (value) => slugRegex.test(value),
        message:
          "Slug can contain lowercase letters, numbers, and hyphens only",
      },
    },

    duration: {
      days: {
        type: Number,
        required: [true, "Itinerary days are required"],
        min: [1, "Itinerary must have at least 1 day"],
        validate: {
          validator: Number.isInteger,
          message: "Itinerary days must be a whole number",
        },
      },

      nights: {
        type: Number,
        required: [true, "Itinerary nights are required"],
        min: [0, "Itinerary nights cannot be negative"],
        validate: {
          validator: Number.isInteger,
          message: "Itinerary nights must be a whole number",
        },
      },
    },

    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    days: [
      {
        dayNumber: {
          type: Number,
          required: [true, "Day number is required"],
          min: [1, "Day number must be at least 1"],
          validate: {
            validator: Number.isInteger,
            message: "Day number must be a whole number",
          },
        },

        title: {
          type: String,
          required: [true, "Day title is required"],
          trim: true,
          maxlength: [200, "Day title cannot exceed 200 characters"],
          validate: {
            validator: (value) => nameRegex.test(value),
            message: "Day title can contain alphabets and spaces only",
          },
        },

        activities: [
          {
            time: {
              type: String,
              trim: true,
              maxlength: [50, "Activity time cannot exceed 50 characters"],
            },

            title: {
              type: String,
              required: [true, "Activity title is required"],
              trim: true,
              maxlength: [200, "Activity title cannot exceed 200 characters"],
            },

            description: {
              type: String,
              trim: true,
              maxlength: [
                2000,
                "Activity description cannot exceed 2000 characters",
              ],
            },

            place: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Place",
              default: null,
            },
          },
        ],
      },
    ],

    estimatedBudget: {
      min: {
        type: Number,
        min: [0, "Minimum budget cannot be negative"],
      },

      max: {
        type: Number,
        min: [0, "Maximum budget cannot be negative"],
      },
    },

    currency: {
      type: String,
      uppercase: true,
      trim: true,
      enum: {
        values: SUPPORTED_CURRENCIES,
        message: "Currency must be INR or USD",
      },
      default: "INR",
    },

    /* Cloudinary cover image */
    coverImage: {
      type: ImageSchema,
      default: null,
    },

    /* Cloudinary gallery */
    gallery: {
      type: [ImageSchema],
      default: [],
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/* ================================================================
   REVIEW SCHEMA
================================================================ */

const ReviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Visitor name is required"],
      trim: true,
      minlength: [2, "Visitor name must be at least 2 characters"],
      maxlength: [100, "Visitor name cannot exceed 100 characters"],
      validate: {
        validator: (value) => nameRegex.test(value),
        message: "Visitor name can contain alphabets and spaces only",
      },
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [150, "Email cannot exceed 150 characters"],
      validate: {
        validator: (value) => emailRegex.test(value),
        message: "Please enter a valid email address",
      },
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    review: {
      type: String,
      required: [true, "Review message is required"],
      trim: true,
      minlength: [10, "Review must be at least 10 characters"],
      maxlength: [1000, "Review cannot exceed 1000 characters"],
    },

    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      default: null,
    },

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "Review status must be pending, approved, or rejected",
      },
      default: "pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/* ================================================================
   MODELS
================================================================ */

export const Admin =
  mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

export const Inquiry =
  mongoose.models.Inquiry || mongoose.model("Inquiry", InquirySchema);

export const Destination =
  mongoose.models.Destination ||
  mongoose.model("Destination", destinationSchema);

export const Place =
  mongoose.models.Place || mongoose.model("Place", placeSchema);

export const Hotel =
  mongoose.models.Hotel || mongoose.model("Hotel", hotelSchema);

export const Restaurant =
  mongoose.models.Restaurant || mongoose.model("Restaurant", restaurantSchema);

export const Transportation =
  mongoose.models.Transportation ||
  mongoose.model("Transportation", transportationSchema);

export const Package =
  mongoose.models.Package || mongoose.model("Package", packageSchema);

export const Itinerary =
  mongoose.models.Itinerary || mongoose.model("Itinerary", itinerarySchema);

export const Review =
  mongoose.models.Review || mongoose.model("Review", ReviewSchema);

/* ================================================================
   EXPORT COMMON VALIDATION VALUES
   Useful for API/form validation
================================================================ */

export {
  ImageSchema,
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  nameRegex,
  phoneRegex,
  emailRegex,
  slugRegex,
  urlRegex,
};
