async function getEnrollment(courseKey) {
  const user = await requireAuth();
  if (!user) return null;
  const { data } = await supabaseClient
    .from('course_enrollments')
    .select('id,status,enrolled_at')
    .eq('user_id', user.id)
    .eq('course_key', courseKey)
    .maybeSingle();
  return data || null;
}

async function enrollInCourse(courseKey, courseType, buttonId, messageId) {
  const user = await requireAuth();
  if (!user) return;
  const button = document.getElementById(buttonId);
  const message = document.getElementById(messageId);
  if (button) button.disabled = true;
  if (message) message.textContent = 'Enrolling...';

  const existing = await getEnrollment(courseKey);
  if (existing && existing.status === 'active') {
    if (message) message.textContent = 'You are already enrolled in this course.';
    if (button) { button.textContent = 'ENROLLED'; button.disabled = true; }
    return;
  }

  let error;
  if (existing) {
    ({ error } = await supabaseClient
      .from('course_enrollments')
      .update({ status: 'active', enrolled_at: new Date().toISOString() })
      .eq('id', existing.id));
  } else {
    ({ error } = await supabaseClient.from('course_enrollments').insert({
      user_id: user.id,
      course_key: courseKey,
      course_type: courseType,
      status: 'active'
    }));
  }

  if (error) {
    if (message) message.textContent = 'Unable to enrol right now. Please try again.';
    if (button) button.disabled = false;
    return;
  }

  if (message) message.textContent = 'Enrolment successful. This course is now available in My Courses.';
  if (button) { button.textContent = 'ENROLLED'; button.disabled = true; }
}

async function syncEnrollmentButton(courseKey, buttonId, messageId) {
  const enrollment = await getEnrollment(courseKey);
  const button = document.getElementById(buttonId);
  const message = document.getElementById(messageId);
  if (enrollment && enrollment.status === 'active') {
    if (button) { button.textContent = 'ENROLLED'; button.disabled = true; }
    if (message) message.textContent = 'Already in My Courses.';
  }
}
