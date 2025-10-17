* Math utilities include file

$constant E 2.71828
$constant GOLDEN_RATIO 1.618034

xtra="CircleArea"
on @xtra
  * Calculate circle area: PI * r^2
  assign("area" = $PI * "radius" * "radius")
endon

xtra="CircleCircumference"
on @xtra
  * Calculate circle circumference: 2 * PI * r
  assign("circumference" = 2 * $PI * "radius")
endon
