import { useEffect, useState } from "react";
import { appointmentService } from "../../services/appointmentService";
import { userService } from "../../services/userService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Label } from "../../components/Label";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    doctor: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    symptoms: "",
  });
  const [errors, setErrors] = useState({
    doctor: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { appointments: data } = await appointmentService.getAll();
      const user = JSON.parse(localStorage.getItem("user"));
      const filteredAppointments = data.filter(
        (appointment) =>
          appointment.patient?._id === user?.id ||
          appointment.patientId === user?.id
      );
      setAppointments(filteredAppointments);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { users } = await userService.getAll({ role: "doctor" });
      setDoctors(users);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    }
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "doctor":
        newErrors.doctor = !value ? "Please select a doctor" : "";
        break;

      case "appointmentDate":
        if (!value) {
          newErrors.appointmentDate = "Date is required";
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (selectedDate < today) {
            newErrors.appointmentDate = "Date must be in the future";
          } else {
            newErrors.appointmentDate = "";
          }
        }
        break;

      case "appointmentTime":
        if (!value) {
          newErrors.appointmentTime = "Time is required";
        } else {
          const hour = parseInt(value.split(":")[0]);
          if (hour < 9 || hour > 17) {
            newErrors.appointmentTime = "Time must be between 9 AM and 5 PM";
          } else {
            newErrors.appointmentTime = "";
          }
        }
        break;

      case "reason":
        if (!value.trim()) {
          newErrors.reason = "Reason is required";
        } else if (value.trim().length < 10) {
          newErrors.reason = "Reason must be at least 10 characters";
        } else {
          newErrors.reason = "";
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[name];
  };

  const validateForm = () => {
    const validations = [
      validateField("doctor", formData.doctor),
      validateField("appointmentDate", formData.appointmentDate),
      validateField("appointmentTime", formData.appointmentTime),
      validateField("reason", formData.reason),
    ];

    return validations.every((isValid) => isValid);
  };

  const isFormValid = () => {
    return (
      formData.doctor &&
      formData.appointmentDate &&
      formData.appointmentTime &&
      formData.reason &&
      formData.reason.length >= 10 &&
      Object.values(errors).every((error) => !error)
    );
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    const fieldName = id === "symptoms" ? "symptoms" : id;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (fieldName !== "symptoms") {
      validateField(fieldName, value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // highlight all errors
      Object.keys(errors).forEach((key) => {
        if (!errors[key]) {
          validateField(key, formData[key]);
        }
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await appointmentService.create(formData);
      setShowForm(false);
      setFormData({
        doctor: "",
        appointmentDate: "",
        appointmentTime: "",
        reason: "",
        symptoms: "",
      });
      setErrors({
        doctor: "",
        appointmentDate: "",
        appointmentTime: "",
        reason: "",
      });
      setShowSuccess(true);
      fetchAppointments();

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await appointmentService.update(id, { status: "cancelled" });
        fetchAppointments();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to cancel appointment");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">
                Appointment booked successfully!
              </p>
              <p className="text-sm text-green-600">
                Your appointment has been scheduled.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="text-muted-foreground mt-2">
            Manage your medical appointments
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>Book Appointment</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Book New Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="doctor">Doctor *</Label>
                  <select
                    id="doctor"
                    className={`flex h-10 w-full rounded-md border ${
                      errors.doctor ? "border-red-500" : "border-input"
                    } bg-background px-3 py-2 text-sm`}
                    value={formData.doctor}
                    onChange={handleChange}
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        {doctor.name}{" "}
                        {doctor.specialization && `- ${doctor.specialization}`}
                      </option>
                    ))}
                  </select>
                  {errors.doctor && (
                    <div className="flex items-center space-x-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.doctor}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentDate">Date *</Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    className={errors.appointmentDate ? "border-red-500" : ""}
                  />
                  {errors.appointmentDate && (
                    <div className="flex items-center space-x-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.appointmentDate}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentTime">Time *</Label>
                  <Input
                    id="appointmentTime"
                    type="time"
                    value={formData.appointmentTime}
                    onChange={handleChange}
                    className={errors.appointmentTime ? "border-red-500" : ""}
                    min="09:00"
                    max="17:00"
                  />
                  {errors.appointmentTime && (
                    <div className="flex items-center space-x-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.appointmentTime}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Available hours: 9:00 AM - 5:00 PM
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Visit *</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="Brief reason for visit (at least 10 characters)"
                    className={errors.reason ? "border-red-500" : ""}
                  />
                  {errors.reason && (
                    <div className="flex items-center space-x-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.reason}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Characters: {formData.reason.length}/10
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms (Optional)</Label>
                <textarea
                  id="symptoms"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.symptoms}
                  onChange={handleChange}
                  placeholder="Describe your symptoms..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex space-x-2 pt-4">
                <Button
                  type="submit"
                  disabled={!isFormValid() || isSubmitting}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Booking..." : "Book Appointment"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setErrors({
                      doctor: "",
                      appointmentDate: "",
                      appointmentTime: "",
                      reason: "",
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>

              {/* Form Validation Summary */}
              {Object.values(errors).some((error) => error) && (
                <div className="border-l-4 border-yellow-500 bg-yellow-50 p-3">
                  <p className="text-sm text-yellow-700">
                    Please fix the errors above before submitting.
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No appointments found</p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment._id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">
                        Dr. {appointment.doctor?.name}
                      </span>
                      {appointment.doctor?.specialization && (
                        <span className="text-sm text-muted-foreground">
                          - {appointment.doctor.specialization}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(
                            new Date(appointment.appointmentDate),
                            "MMM dd, yyyy"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{appointment.appointmentTime}</span>
                      </div>
                    </div>
                    {appointment.reason && (
                      <p className="text-sm">{appointment.reason}</p>
                    )}
                    {appointment.symptoms && (
                      <p className="text-sm text-muted-foreground">
                        Symptoms: {appointment.symptoms}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {appointment.status}
                    </span>
                    {appointment.status !== "cancelled" &&
                      appointment.status !== "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(appointment._id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
