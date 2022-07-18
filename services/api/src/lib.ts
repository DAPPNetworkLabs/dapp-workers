export const preCheck = (approvedServices,image,res) => {
    if(!image || !approvedServices.includes(image)) {
        return res.status(401).send("Image doesn't exist or not supported");
    }
}