import 'package:bmi_calculator/constantFile.dart';
import 'package:flutter/material.dart';
import 'constantFile.dart';
class RepeatTextandIconsWidget extends StatelessWidget {
  const RepeatTextandIconsWidget({
    Key? key,
    required this.icondata,
    required this.label,
  }) : super(key: key);

  final IconData icondata;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: <Widget>[
        Icon(
          icondata,
          size: 80.0,
        ),
        const SizedBox(
          height: 15.0,
        ),
        Text(
          label,
          style: klabelstyle,
        ),
      ],
    );
  }
}
