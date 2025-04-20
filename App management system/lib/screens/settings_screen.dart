import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../providers/task_appearance_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final List<List<Color>> _presetGradients = [
    [Colors.blue, Colors.purple],
    [Colors.green, Colors.teal],
    [Colors.orange, Colors.deepOrange],
    [Colors.pink, Colors.red],
    [Colors.indigo, Colors.blue],
  ];

  final List<FontWeight> _fontWeights = [
    FontWeight.normal,
    FontWeight.w400,
    FontWeight.w500,
    FontWeight.w600,
    FontWeight.bold,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSectionTitle('Theme Colors'),
          const SizedBox(height: 16),
          _buildThemeColorsSection(),
          const SizedBox(height: 24),
          _buildSectionTitle('Task Appearance'),
          const SizedBox(height: 16),
          _buildTaskAppearanceSection(),
          const SizedBox(height: 24),
          _buildSectionTitle('Dialog Appearance'),
          const SizedBox(height: 16),
          _buildDialogAppearanceSection(),
          const SizedBox(height: 24),
          _buildSectionTitle('Custom Colors'),
          const SizedBox(height: 16),
          _buildCustomColorsSection(),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildThemeColorsSection() {
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _presetGradients.length,
        itemBuilder: (context, index) {
          final colors = _presetGradients[index];
          return Padding(
            padding: const EdgeInsets.only(right: 16),
            child: GestureDetector(
              onTap: () {
                context.read<ThemeProvider>().updateGradientColors(colors);
              },
              child: Container(
                width: 100,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: colors,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Colors.grey,
                    width: 2,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTaskAppearanceSection() {
    final appearanceProvider = context.watch<TaskAppearanceProvider>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSliderSetting(
          'Title Font Size',
          appearanceProvider.titleFontSize,
          12.0,
          24.0,
          (value) => appearanceProvider.updateTitleFontSize(value),
        ),
        const SizedBox(height: 16),
        _buildSliderSetting(
          'Description Font Size',
          appearanceProvider.descriptionFontSize,
          10.0,
          18.0,
          (value) => appearanceProvider.updateDescriptionFontSize(value),
        ),
        const SizedBox(height: 16),
        _buildFontWeightSelector(
          'Title Font Weight',
          appearanceProvider.titleFontWeight,
          (weight) => appearanceProvider.updateTitleFontWeight(weight),
        ),
        const SizedBox(height: 16),
        _buildFontWeightSelector(
          'Description Font Weight',
          appearanceProvider.descriptionFontWeight,
          (weight) => appearanceProvider.updateDescriptionFontWeight(weight),
        ),
        const SizedBox(height: 16),
        _buildSliderSetting(
          'Task Corner Radius',
          appearanceProvider.taskCornerRadius,
          8.0,
          24.0,
          (value) => appearanceProvider.updateTaskCornerRadius(value),
        ),
        const SizedBox(height: 16),
        _buildSliderSetting(
          'Task Shadow Opacity',
          appearanceProvider.taskShadowOpacity,
          0.0,
          0.5,
          (value) => appearanceProvider.updateTaskShadowOpacity(value),
        ),
        const SizedBox(height: 16),
        _buildSliderSetting(
          'Task Shadow Blur',
          appearanceProvider.taskShadowBlur,
          0.0,
          12.0,
          (value) => appearanceProvider.updateTaskShadowBlur(value),
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: () => appearanceProvider.resetToDefaults(),
          child: const Text('Reset to Defaults'),
        ),
      ],
    );
  }

  Widget _buildDialogAppearanceSection() {
    final appearanceProvider = context.watch<TaskAppearanceProvider>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSliderSetting(
          'Dialog Corner Radius',
          appearanceProvider.dialogCornerRadius,
          8.0,
          24.0,
          (value) => appearanceProvider.updateDialogCornerRadius(value),
        ),
        const SizedBox(height: 16),
        _buildSliderSetting(
          'Dialog Animation Duration',
          appearanceProvider.dialogAnimationDuration,
          0.1,
          0.5,
          (value) => appearanceProvider.updateDialogAnimationDuration(value),
        ),
        const SizedBox(height: 16),
        _buildSliderSetting(
          'Dialog Background Opacity',
          appearanceProvider.dialogBackgroundOpacity,
          0.5,
          1.0,
          (value) => appearanceProvider.updateDialogBackgroundOpacity(value),
        ),
        const SizedBox(height: 16),
        _buildSliderSetting(
          'Dialog Elevation',
          appearanceProvider.dialogElevation,
          0.0,
          16.0,
          (value) => appearanceProvider.updateDialogElevation(value),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            const Text('Use Gradient Background'),
            const SizedBox(width: 8),
            Switch(
              value: appearanceProvider.dialogUseGradient,
              onChanged: (value) =>
                  appearanceProvider.updateDialogUseGradient(value),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _buildDialogColorPicker(
          'Dialog Gradient Start Color',
          appearanceProvider.dialogGradientStartColor,
          (color) {
            final colors = [
              color,
              appearanceProvider.dialogGradientEndColor,
            ];
            appearanceProvider.updateDialogGradientColors(colors[0], colors[1]);
          },
        ),
        const SizedBox(height: 16),
        _buildDialogColorPicker(
          'Dialog Gradient End Color',
          appearanceProvider.dialogGradientEndColor,
          (color) {
            final colors = [
              appearanceProvider.dialogGradientStartColor,
              color,
            ];
            appearanceProvider.updateDialogGradientColors(colors[0], colors[1]);
          },
        ),
        const SizedBox(height: 16),
        _buildDialogColorPicker(
          'Dialog Text Color',
          appearanceProvider.dialogTextColor,
          (color) => appearanceProvider.updateDialogTextColor(color),
        ),
        const SizedBox(height: 16),
        _buildDialogColorPicker(
          'Dialog Input Border Color',
          appearanceProvider.dialogInputBorderColor,
          (color) => appearanceProvider.updateDialogInputBorderColor(color),
        ),
        const SizedBox(height: 16),
        _buildDialogColorPicker(
          'Dialog Input Background Color',
          appearanceProvider.dialogInputBackgroundColor,
          (color) => appearanceProvider.updateDialogInputBackgroundColor(color),
        ),
      ],
    );
  }

  Widget _buildSliderSetting(
    String label,
    double value,
    double min,
    double max,
    Function(double) onChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label),
        Slider(
          value: value,
          min: min,
          max: max,
          divisions: ((max - min) * 10).round(),
          label: value.toStringAsFixed(1),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildFontWeightSelector(
    String label,
    FontWeight currentWeight,
    Function(FontWeight) onWeightChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: _fontWeights.map((weight) {
            return GestureDetector(
              onTap: () => onWeightChanged(weight),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: currentWeight == weight
                      ? Theme.of(context).primaryColor
                      : Colors.grey[200],
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  _getFontWeightName(weight),
                  style: TextStyle(
                    color:
                        currentWeight == weight ? Colors.white : Colors.black87,
                    fontWeight: weight,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  String _getFontWeightName(FontWeight weight) {
    switch (weight) {
      case FontWeight.normal:
        return 'Normal';
      case FontWeight.w400:
        return 'Regular';
      case FontWeight.w500:
        return 'Medium';
      case FontWeight.w600:
        return 'Semi Bold';
      case FontWeight.bold:
        return 'Bold';
      default:
        return 'Normal';
    }
  }

  Widget _buildCustomColorsSection() {
    return Column(
      children: [
        _buildColorPicker(
          'Primary Color',
          context.watch<ThemeProvider>().gradientColors[0],
          (color) {
            final colors = context.read<ThemeProvider>().gradientColors;
            context.read<ThemeProvider>().updateGradientColors([
              color,
              colors[1],
            ]);
          },
        ),
        const SizedBox(height: 16),
        _buildColorPicker(
          'Secondary Color',
          context.watch<ThemeProvider>().gradientColors[1],
          (color) {
            final colors = context.read<ThemeProvider>().gradientColors;
            context.read<ThemeProvider>().updateGradientColors([
              colors[0],
              color,
            ]);
          },
        ),
      ],
    );
  }

  Widget _buildColorPicker(
    String label,
    Color color,
    Function(Color) onColorChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: [
            _buildColorOption(Colors.blue, onColorChanged),
            _buildColorOption(Colors.purple, onColorChanged),
            _buildColorOption(Colors.green, onColorChanged),
            _buildColorOption(Colors.teal, onColorChanged),
            _buildColorOption(Colors.orange, onColorChanged),
            _buildColorOption(Colors.deepOrange, onColorChanged),
            _buildColorOption(Colors.pink, onColorChanged),
            _buildColorOption(Colors.red, onColorChanged),
            _buildColorOption(Colors.indigo, onColorChanged),
          ],
        ),
      ],
    );
  }

  Widget _buildColorOption(Color color, Function(Color) onColorChanged) {
    return GestureDetector(
      onTap: () => onColorChanged(color),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(
            color: Colors.grey,
            width: 2,
          ),
        ),
      ),
    );
  }

  Widget _buildDialogColorPicker(
    String label,
    Color color,
    Function(Color) onColorChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: [
            _buildColorOption(Colors.blue, onColorChanged),
            _buildColorOption(Colors.purple, onColorChanged),
            _buildColorOption(Colors.green, onColorChanged),
            _buildColorOption(Colors.teal, onColorChanged),
            _buildColorOption(Colors.orange, onColorChanged),
            _buildColorOption(Colors.deepOrange, onColorChanged),
            _buildColorOption(Colors.pink, onColorChanged),
            _buildColorOption(Colors.red, onColorChanged),
            _buildColorOption(Colors.indigo, onColorChanged),
            _buildColorOption(Colors.white, onColorChanged),
            _buildColorOption(Colors.black87, onColorChanged),
          ],
        ),
      ],
    );
  }
}
