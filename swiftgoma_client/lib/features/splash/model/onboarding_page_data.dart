class OnboardingPageData {
  const OnboardingPageData({required this.title, required this.description});

  final String title;
  final String description;

  static const List<OnboardingPageData> pages = [
    OnboardingPageData(
      title: 'Create a prototype in just a few minutes',
      description:
          'Enjoy these pre-made components and worry only about creating the best product ever.',
    ),
    OnboardingPageData(
      title: 'Fast delivery right to your door',
      description:
          'Order from your favorite stores and track your delivery in real time, every step of the way.',
    ),
    OnboardingPageData(
      title: 'Pay safely and easily',
      description:
          'Secure payments with the methods you already use and love. No hidden fees, ever.',
    ),
  ];
}
