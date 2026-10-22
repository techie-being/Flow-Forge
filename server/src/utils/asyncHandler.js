const asyncHandler = async function(handler){
    return (req,res,next) => {
        Promise.resolve(handler(req,res,next))
        .catch((error) => next(error))

    }
}
export {asyncHandler}