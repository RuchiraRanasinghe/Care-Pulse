"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { getAppointmentSchema } from "@/lib/validation";
import "react-phone-number-input/style.css";
import CustomFormField from "../CustomFormField";
import { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";
import { Doctors } from "@/constants";
import { SelectItem } from "../ui/select";
import { createAppointment, updateAppointment } from "@/lib/actions/appointment.actions";
import { Appointment } from "@/types/appwrite.types";

export const AppointmentForm = ({
    userId, patientId, type, appointment, setOpen
}: {
    userId: string;
    patientId: string;
    type: "create" | "cancel" | "schedule";
    appointment?: Appointment;
    setOpen: (open: boolean) => void;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const AppointmentFormValidation = getAppointmentSchema(type);

  const form = useForm<z.infer<typeof AppointmentFormValidation>>({
    resolver: zodResolver(AppointmentFormValidation),
    defaultValues: {
      primaryPhysician: appointment ? appointment?.primaryPhysician : "",
      schedule: appointment ? new Date(appointment?.schedule!) : new Date(Date.now()),
      reason: appointment ? appointment.reason : "",
      note: appointment?.note || "",
      cancellationReason: appointment?.cancellationReason || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof AppointmentFormValidation>) => {
    setIsLoading(true);

    let status;
    switch (type) {
        case "schedule":
            status = "scheduled";
            break;
        case "cancel":
            status = "cancelled";
            break;
        default:
            status = "pending";
            break;
        }

    try {
      if (type === 'create' && patientId) {
        const appointmentData = {
            userId,
            patient: patientId,
            primaryPhysician: values.primaryPhysician,
            schedule: new Date(values.schedule),
            reason: values.reason!,
            note: values.note,
            status: status as Status,
        }
        const appointment = await createAppointment(appointmentData);

        if (appointment) {
            form.reset();
            router.push(`/patients/${userId}/new-appointment/success?appointmentId=${appointment.$id}`);
        }
      } else {
        const appointmentToUpdate = {
            userId,
            appointmentId: appointment?.$id!,
            appointment: {
                primaryPhysician: values?.primaryPhysician,
                schedule: new Date(values?.schedule),
                status: status as Status,
                cancellationReason: values?.cancellationReason,
            },
            type,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Add the timeZone property
        }

        const updatedAppointment = await updateAppointment(appointmentToUpdate);

        if (updatedAppointment) {
            setOpen && setOpen(false);
            form.reset();
        }
      }

    } catch (error) {
      console.log(error);
    }

    setIsLoading(false);
  };

  let buttonLabel;

  switch (type) {
    case 'cancel':
        buttonLabel = "Cancel Appointment";
        break;
    case 'create':
        buttonLabel = "Create Appointment";
        break;
    case 'schedule':
        buttonLabel = "Schedule Appointment";
        break;
  
    default:
        break;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6">
        {type === 'create' && <section className="mb-12 space-y-4">
          <h1 className="header">New Appointment</h1>
          <p className="text-dark-700">Get started with appointments.</p>
        </section>}

        {type !== "cancel" && (
            <>
                <CustomFormField
                    fieldType={FormFieldType.SELECT}
                    control={form.control}
                    name="primaryPhysician"
                    label="Doctor"
                    placeholder="Select a doctor"
                >
                    { Doctors.map((doctor) => (
                        <SelectItem key={doctor.name} value={doctor.name}>
                            <div className="flex cursor-pointer items-center gap-2">
                                <Image 
                                    src={doctor.image}
                                    height={32}
                                    width={32}
                                    alt={doctor.name}
                                    className="rounded-full border border-dark-500"
                                />
                                <p>{doctor.name}</p>
                            </div>
                        </SelectItem>
                    ))}
                </CustomFormField>

                <CustomFormField
                    fieldType={FormFieldType.DATE_PICKER}
                    control={form.control}
                    name="schedule"
                    label="Expected appointment date"
                    showTimeSelect
                    dateFormat="MMMM d, yyyy h:mm aa"
                />

                <div className="flex flex-col gap-6 xl:flex-row">
                    <CustomFormField
                        fieldType={FormFieldType.TEXTAREA}
                        control={form.control}
                        name="reason"
                        label="Reason for appointment"
                        placeholder="Checkup, follow-up, etc."
                    />

                    <CustomFormField
                        fieldType={FormFieldType.TEXTAREA}
                        control={form.control}
                        name="note"
                        label="Note"
                        placeholder="Enter notes here..."
                    />
                </div>
            </>
        )}

        {type === "cancel" && (
            <CustomFormField
                fieldType={FormFieldType.TEXTAREA}
                control={form.control}
                name="cancelationReason"
                label="Reason for cancellation"
                placeholder="Select a reason"
            />
        )}

        <SubmitButton isLoading={isLoading} className={`${type === 'cancel' ? 'shad-danger-btn' : 'shad-primary-btn'} w-full`}>{buttonLabel}</SubmitButton>
      </form>
    </Form>
  );
};
export default AppointmentForm;