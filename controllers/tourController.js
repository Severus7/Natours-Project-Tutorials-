const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utilities/apiFeatures');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');

// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

//2) ROUTE HANDLERS
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage, price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // 1) Filtering
  // const queryObj = { ...req.query };
  // const excludeFields = ['page', 'sort', 'limit', 'fields'];
  // excludeFields.forEach(el => delete queryObj[el]);

  // //console.log(req.query, queryObj);
  // // //2) Advanced filtering
  // let queryStr = JSON.stringify(queryObj);
  // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  // console.log(JSON.parse(queryStr));

  // // //{ difficulty: 'easy' , duration: { $gte: 5 } }

  // // const query = Tour.find(queryObj);
  // let query = Tour.find(JSON.parse(queryStr));

  // const tours = await Tour.find({
  //     duration: 5,
  //     difficulty: 'easy'
  // })

  // // const query = Tour.find()
  // //   .where('destination')
  // //   .equals(5)
  // //   .where('difficulty')
  // //   .equals('easy');

  //3) Sorting
  // if (req.query.sort)
  // {
  //     const sortBy = req.query.sort.split(',').join(' ');
  //     console.log(sortBy);
  //     query = query.sort(sortBy);
  // } else {
  //     query = query.sort('-createdAt'); //default order if the user did not set a sort
  // }

  //4) Field limiting
  // if (req.query.fields)
  // {
  //     const fields = req.query.fields.split(',').join(' ');
  //     query = query.select(fields);
  // } else {
  //     query = query.select('-__v'); //excluding this mongoose field
  // }

  // //5) Pagination
  // const page = req.query.page * 1 || 1;
  // const limit = req.query.limit * 1 || 100;
  // const skip = (page - 1) * limit;

  // query = query.skip(skip).limit(limit);

  // if (req.query.page)
  // {
  //     const numTours = await Tour.countDocuments();
  //     if (skip >= numTours) throw new Error('This page does not exist');
  // }

  // //Execute Query

  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if(!tour)
  {
    return next(new AppError('Error 404 page not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    },
  });
  //Creates an array where
  // const tour = tours.find(el => el.id === id);
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    },
  });
  //console.log(req.body);
  // const newId = tours[tours.length - 1].id + 1;
  // const newTour = Object.assign({id: newId}, req.body);

  // tours.push(newTour);

  // fs.writeFile(`${__dirname}/../dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
  //     res.status(201).json({
  //         status: "success",
  //         data: {
  //             tour: newTour
  //         }
  //     });
  // });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  // if(req.params.id * 1 > tours.length)
  // {
  //     return res.status(404).json({
  //         status: 'fail',
  //         message: 'Invalid ID'
  //     })
  // }

  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if(!tour)
  {
    return next(new AppError('Error 404 page not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if(!tour)
    {
      return next(new AppError('Error 404 page not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
          $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
          $group: {
            _id: { $toUpper: '$difficulty' },
            numTours: { $sum: 1 },
            numRatings: { $sum: '$ratingsQuantity' },
            avgRating: { $avg: '$ratingsAverage' },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
          },
        },
        {
          $sort: {
            avgPrice: 1,
          },
        },
      ]);
  
      res.status(200).json({
        status: 'success',
        data: {
          stats
        },
      });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numTourStarts: -1 }, //descending order
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
});