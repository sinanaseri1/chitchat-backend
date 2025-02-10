async function Validate(req, res) {
  console.log("hitting this function");
  res
    .status(200)
    .send({ message: "Welcome to the dashboard!", user: req.user });
}
module.exports = { Validate };
