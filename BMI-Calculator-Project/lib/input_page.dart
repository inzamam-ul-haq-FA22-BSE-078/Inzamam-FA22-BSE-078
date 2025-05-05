import 'package:bmi_calculator/constantFile.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'iconTextFile.dart';
import 'containerFile.dart';
import 'constantFile.dart';


enum Gender{
  male,
  female,
  none,
}

class InputPage extends StatefulWidget {
  @override
  _InputPageState createState() => _InputPageState();
}

class _InputPageState extends State<InputPage> {

  Gender selectGender=Gender.none;
  int sliderHeight=180;
// Color maleColor = deActiveColor;
// Color feMaleColor = deActiveColor;
// void updateColor(Gender gendertype) {
//   if (gendertype==Gender.male)
//     {
//        maleColor = activeColor;
//        feMaleColor = deActiveColor;
//     }
//   if (gendertype==Gender.female)
//   {
//     maleColor = deActiveColor;
//     feMaleColor = activeColor;
//   }
// }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('BMI CALCULATOR'),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children:<Widget> [
          Expanded(child: Row(
            children: <Widget>[
              Expanded(

                    child: RepeatContainerCode(
                      onPressed: (){
                        setState(() {
                          selectGender=Gender.male;
                        });
                      },
                                    colors: selectGender==Gender.male?activeColor:deActiveColor,
                                    cardWidget: RepeatTextandIconsWidget(
                    icondata: FontAwesomeIcons.male,
                    label: 'MALE',
                                    ),
                                  ),

              ),
              Expanded(

                    child: RepeatContainerCode(
                      onPressed: (){
                        setState(() {
                          selectGender=Gender.female;
                        });
                      },
                                    colors: selectGender==Gender.female?activeColor:deActiveColor ,
                                    cardWidget: RepeatTextandIconsWidget(
                    icondata: FontAwesomeIcons.female,
                    label: 'FEMALE',
                                    ),
                                  ),

              ),
            ],
          )),
          Expanded(
            child: RepeatContainerCode(
              colors: Color(0xFF1D1E33),
            )
          ),
          Expanded(child: Row(
            children: <Widget>[
              Expanded(child:
              RepeatContainerCode(
                colors: Color(0xFF1D1E33),
                cardWidget: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    Text('Height', style: klabelstyle,),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: <Widget>[
                        Text(
                            sliderHeight.toString(),
                          style: knumberstyle
                        ),
                        Text(
                          'cm',
                          style: klabelstyle,
                        ),

                      ],
                    ),
                    Slider(
                      value: sliderHeight.toDouble(),
                      min: 120,
                      max: 220,
                      activeColor: Color(0xFFEB1555),
                      inactiveColor: Color(0xFF8D8E98),
                      onChanged: (double newValue) {
                        setState(() {
                          sliderHeight = newValue.round();
                        });
                      },
                    ),
                  ],
                ),
              )
              ),
              Expanded(child:
              RepeatContainerCode(
                colors: Color(0xFF1D1E33),
              )
              ),
            ],
          )),
        ],
      ),
    );
  }
}


