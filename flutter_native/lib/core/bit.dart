import 'package:flutter/material.dart';
import 'package:rive/rive.dart';

class Bit extends StatefulWidget {
  final String reaction;
  final String dialogue;
  const Bit({
    super.key,
    this.reaction = 'idle',
    this.dialogue = 'The compiler is ready. Is the code?',
  });
  @override
  State<Bit> createState() => _BitState();
}

class _BitState extends State<Bit> {
  StateMachineController? machine;
  void react() {
    (machine?.findInput<bool>(widget.reaction) as SMITrigger?)?.fire();
  }

  @override
  void didUpdateWidget(Bit old) {
    super.didUpdateWidget(old);
    if (old.reaction != widget.reaction) react();
  }

  @override
  void dispose() {
    machine?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Row(
    children: [
      SizedBox(
        width: 100,
        height: 125,
        child: RiveAnimation.asset(
          'assets/animations/bit.riv',
          artboard: 'Bit',
          onInit: (board) {
            machine = StateMachineController.fromArtboard(board, 'BitMentor');
            if (machine != null) {
              board.addController(machine!);
              react();
              machine!.isActive = !MediaQuery.disableAnimationsOf(context);
            }
          },
        ),
      ),
      Expanded(
        child: Text(
          widget.dialogue,
          style: const TextStyle(color: Color(0xFFA6B3C8), fontSize: 13),
        ),
      ),
    ],
  );
}
