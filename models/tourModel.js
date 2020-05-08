const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');

const tourSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'A tour must have a name'], //validator
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have less or equal than 40 characters'],
      minLength: [10, 'A tour name must have less or equal than 10 characters'],
      //validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String, 
    duration : {
      type: Number,
      required: [true, 'A tour must have a duration'] //validator
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'] //validator
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'], //validator
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficuly is either: easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be 1.0 or above'],
      max: [5, 'Rating must be 5.0 or below']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val > this.price;
        },
        message: 'Discount price  ({VALUE}) should be below the regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String], //Array of type string
    createdAt: {
      type: Date,
      default: Date.now()
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    }
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true}
});

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
//   this.find({ secretTour: { $ne: true } });

//   next();
// });

tourSchema.pre(/^find/, function(next) { // /^find/ is a regular expression
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});
 
tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  console.log(docs);
  next();
});

//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour; 