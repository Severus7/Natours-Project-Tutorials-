const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'All users must have a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'All users must enter an email'],
        unique: true,
        lowercase: true, //transform email to lowercase
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'All users must enter a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Confirm your password'],
        validate: {
            //This will only works on CREATE and SAVE
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12) //encrypt password

    this.passwordConfirm = undefined; //passwordConfirm is not save in the database
    next();
});

// userSchema.pre('save', function(next) {
//     if (!this.isModified('password') || this.isNew) return (next);

//     this.passwordChangedAt = Date.now() - 1000;
//     next();
// });

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function() {
    //Generate new token
    const resetToken = crypto.randomBytes(32).toString('hex');

    //encrypt the resetToken using built-in crypto module
    //this encrypted token is the one will be saved in the database
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    console.log({resetToken}, this.passwordResetToken);
    //Password expires in 10minutes
    //Date.now() is added 10 minutes then multiplied to 60 to convert into seconds
    //and multiplied to 100 to convert into milliseconds
    this.passwordResetExpires = Date.now() + 10  * 60 * 1000;

    //return the unencrypted reset token
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;